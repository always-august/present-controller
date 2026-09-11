import type {
  Message,
  MessageInput,
  Room,
  RoomSettings,
  ServerEvent,
  Timer,
  TimerInput,
} from "../shared/types";
import { IDLE_PLAYBACK } from "../shared/types";
import { newEntityId } from "./ids";
import type { RoomStore } from "./store";

type Broadcast = (roomId: string, event: ServerEvent) => void;

const MAX_TIMEOUT = 2 ** 31 - 1;

/**
 * 재생 상태 전환과 서버 측 스케줄링(chainNext, scheduledStart)을 담당.
 * 틱은 절대 브로드캐스트하지 않고, 상태가 바뀔 때만 절대 시각 기준 PlaybackState를 전파한다.
 */
export class RoomEngine {
  private scheduled = new Map<string, NodeJS.Timeout[]>();

  constructor(
    private store: RoomStore,
    private broadcast: Broadcast,
  ) {
    store.setExpiryHandler((roomId) => this.clearSchedule(roomId));
  }

  // ---------- 조회 도우미 ----------

  private sortedTimers(room: Room) {
    return [...room.timers].sort((a, b) => a.order - b.order);
  }

  activeTimer(room: Room): Timer | undefined {
    return room.timers.find((t) => t.id === room.activeTimerId);
  }

  private neighbor(room: Room, dir: 1 | -1): Timer | undefined {
    const list = this.sortedTimers(room);
    if (list.length === 0) return undefined;
    const idx = list.findIndex((t) => t.id === room.activeTimerId);
    if (idx === -1) return dir === 1 ? list[0] : list[list.length - 1];
    return list[idx + dir];
  }

  // ---------- 재생 제어 ----------

  start(room: Room, timerId?: string) {
    const now = Date.now();
    let target = timerId ? room.timers.find((t) => t.id === timerId) : this.activeTimer(room);
    if (!target) target = this.sortedTimers(room)[0];
    if (!target) return;

    const switching = target.id !== room.activeTimerId;
    if (switching) {
      room.activeTimerId = target.id;
      room.playback = { ...IDLE_PLAYBACK };
    }

    const pb = room.playback;
    if (pb.status === "running") return;

    const remaining =
      pb.status === "paused" && pb.remainingMs != null
        ? pb.remainingMs
        : target.durationMs + pb.adjustmentMs;

    room.playback = {
      status: "running",
      deadline: now + remaining,
      remainingMs: null,
      startedAt: pb.startedAt ?? now,
      adjustmentMs: pb.adjustmentMs,
    };
    this.commitPlayback(room);
  }

  pause(room: Room) {
    const pb = room.playback;
    if (pb.status !== "running" || pb.deadline == null) return;
    room.playback = {
      ...pb,
      status: "paused",
      remainingMs: pb.deadline - Date.now(),
      deadline: null,
    };
    this.commitPlayback(room);
  }

  toggle(room: Room) {
    if (room.playback.status === "running") this.pause(room);
    else this.start(room);
  }

  reset(room: Room) {
    room.playback = { ...IDLE_PLAYBACK };
    this.commitPlayback(room);
  }

  stop(room: Room) {
    room.playback = { ...IDLE_PLAYBACK };
    room.activeTimerId = null;
    this.commitPlayback(room);
  }

  adjust(room: Room, deltaMs: number) {
    if (!Number.isFinite(deltaMs)) return;
    const pb = room.playback;
    const adjustmentMs = pb.adjustmentMs + deltaMs;
    if (pb.status === "running" && pb.deadline != null) {
      room.playback = { ...pb, deadline: pb.deadline + deltaMs, adjustmentMs };
    } else if (pb.status === "paused" && pb.remainingMs != null) {
      room.playback = { ...pb, remainingMs: pb.remainingMs + deltaMs, adjustmentMs };
    } else {
      room.playback = { ...pb, adjustmentMs };
    }
    this.commitPlayback(room);
  }

  /** 다음/이전 타이머로 이동. 진행 중이었다면 이동한 타이머를 바로 시작한다. */
  move(room: Room, dir: 1 | -1) {
    const target = this.neighbor(room, dir);
    if (!target) return;
    const wasRunning = room.playback.status === "running";
    room.activeTimerId = target.id;
    room.playback = { ...IDLE_PLAYBACK };
    if (wasRunning) {
      this.start(room, target.id);
    } else {
      this.commitPlayback(room);
    }
  }

  private commitPlayback(room: Room) {
    this.store.touch(room);
    this.reschedule(room);
    this.broadcast(room.id, {
      type: "playback:update",
      payload: { playback: room.playback, activeTimerId: room.activeTimerId },
    });
  }

  // ---------- 타이머 CRUD ----------

  private normalizeTimer(input: TimerInput, base: Timer): Timer {
    const durationMs = Math.max(0, Math.round(Number(input.durationMs ?? base.durationMs) || 0));
    return {
      ...base,
      title: String(input.title ?? base.title).slice(0, 120),
      speaker: String(input.speaker ?? base.speaker).slice(0, 120),
      notes: String(input.notes ?? base.notes).slice(0, 2000),
      mode: input.mode ?? base.mode,
      durationMs,
      startMode: input.startMode ?? base.startMode,
      scheduledStart:
        input.scheduledStart === undefined
          ? base.scheduledStart
          : input.scheduledStart == null
            ? null
            : Number(input.scheduledStart),
      wrapUpMs: Math.max(0, Math.round(Number(input.wrapUpMs ?? base.wrapUpMs) || 0)),
      chainNext: Boolean(input.chainNext ?? base.chainNext),
      appearance: input.appearance ?? base.appearance,
    };
  }

  private blankTimer(order: number): Timer {
    return {
      id: newEntityId(),
      title: "",
      speaker: "",
      notes: "",
      mode: "countdown",
      durationMs: 10 * 60 * 1000,
      startMode: "manual",
      scheduledStart: null,
      wrapUpMs: 60 * 1000,
      chainNext: false,
      appearance: "default",
      order,
    };
  }

  createTimer(room: Room, input: TimerInput): Timer {
    const order = room.timers.reduce((m, t) => Math.max(m, t.order), -1) + 1;
    const timer = this.normalizeTimer(input, this.blankTimer(order));
    room.timers.push(timer);
    if (!room.activeTimerId) room.activeTimerId = timer.id;
    this.commitTimers(room);
    return timer;
  }

  importTimers(room: Room, inputs: TimerInput[]) {
    let order = room.timers.reduce((m, t) => Math.max(m, t.order), -1) + 1;
    for (const input of inputs.slice(0, 200)) {
      room.timers.push(this.normalizeTimer(input, this.blankTimer(order++)));
    }
    if (!room.activeTimerId && room.timers.length) room.activeTimerId = this.sortedTimers(room)[0].id;
    this.commitTimers(room);
  }

  updateTimer(room: Room, id: string, input: TimerInput) {
    const idx = room.timers.findIndex((t) => t.id === id);
    if (idx === -1) return;
    room.timers[idx] = this.normalizeTimer(input, room.timers[idx]);
    this.commitTimers(room);
  }

  deleteTimer(room: Room, id: string) {
    const wasActive = room.activeTimerId === id;
    room.timers = room.timers.filter((t) => t.id !== id);
    this.sortedTimers(room).forEach((t, i) => (t.order = i));
    if (wasActive) {
      room.activeTimerId = this.sortedTimers(room)[0]?.id ?? null;
      room.playback = { ...IDLE_PLAYBACK };
      this.commitPlayback(room);
    }
    this.commitTimers(room);
  }

  reorderTimers(room: Room, ids: string[]) {
    const orderMap = new Map(ids.map((id, i) => [id, i]));
    let tail = ids.length;
    for (const t of this.sortedTimers(room)) {
      t.order = orderMap.get(t.id) ?? tail++;
    }
    this.commitTimers(room);
  }

  private commitTimers(room: Room) {
    this.store.touch(room);
    this.reschedule(room);
    this.broadcast(room.id, { type: "timers:update", payload: room.timers });
    // 활성 타이머의 길이가 바뀌면 idle 상태의 표시 시간도 바뀌므로 함께 전파
    this.broadcast(room.id, {
      type: "playback:update",
      payload: { playback: room.playback, activeTimerId: room.activeTimerId },
    });
  }

  // ---------- 메시지 ----------

  createMessage(room: Room, input: MessageInput, source: Message["source"] = "operator"): Message {
    const msg: Message = {
      id: newEntityId(),
      text: String(input.text ?? "").slice(0, 500),
      color: input.color ?? "white",
      bold: Boolean(input.bold ?? false),
      flash: Boolean(input.flash ?? false),
      visible: Boolean(input.visible ?? false),
      source,
      createdAt: Date.now(),
    };
    room.messages.push(msg);
    if (room.messages.length > 200) room.messages.splice(0, room.messages.length - 200);
    this.commitMessages(room);
    return msg;
  }

  updateMessage(room: Room, id: string, input: MessageInput) {
    const msg = room.messages.find((m) => m.id === id);
    if (!msg) return;
    if (input.text !== undefined) msg.text = String(input.text).slice(0, 500);
    if (input.color !== undefined) msg.color = input.color;
    if (input.bold !== undefined) msg.bold = Boolean(input.bold);
    if (input.flash !== undefined) msg.flash = Boolean(input.flash);
    if (input.visible !== undefined) msg.visible = Boolean(input.visible);
    this.commitMessages(room);
  }

  toggleMessage(room: Room, id: string, visible?: boolean) {
    const msg = room.messages.find((m) => m.id === id);
    if (!msg) return;
    msg.visible = visible ?? !msg.visible;
    this.commitMessages(room);
  }

  deleteMessage(room: Room, id: string) {
    room.messages = room.messages.filter((m) => m.id !== id);
    this.commitMessages(room);
  }

  private commitMessages(room: Room) {
    this.store.touch(room);
    this.broadcast(room.id, { type: "messages:update", payload: room.messages });
  }

  // ---------- 설정 ----------

  updateSettings(room: Room, patch: Partial<RoomSettings>) {
    room.settings = { ...room.settings, ...patch };
    this.store.touch(room);
    this.broadcast(room.id, { type: "settings:update", payload: room.settings });
  }

  // ---------- 서버 스케줄러 ----------

  clearSchedule(roomId: string) {
    for (const t of this.scheduled.get(roomId) ?? []) clearTimeout(t);
    this.scheduled.delete(roomId);
  }

  /**
   * 방 상태가 바뀔 때마다 기존 예약을 모두 지우고 다시 건다.
   * - chainNext: 활성 타이머의 deadline에 다음 타이머 자동 시작
   * - scheduledStart: 예약 시각에 해당 타이머 자동 시작
   * 뷰어만 열려 있어도 동작해야 하므로 반드시 서버에서 처리한다.
   */
  reschedule(room: Room) {
    this.clearSchedule(room.id);
    const handles: NodeJS.Timeout[] = [];
    const now = Date.now();

    const active = this.activeTimer(room);
    const pb = room.playback;
    if (active?.chainNext && pb.status === "running" && pb.deadline != null) {
      const next = this.neighbor(room, 1);
      const delay = pb.deadline - now;
      if (next && delay <= MAX_TIMEOUT) {
        const expectedDeadline = pb.deadline;
        handles.push(
          setTimeout(() => {
            const live = this.store.get(room.id);
            if (!live) return;
            // 그 사이 상태가 바뀌었으면(일시정지, 가감 등) 무시. 바뀌었다면 reschedule이 새로 걸었을 것
            if (live.playback.status !== "running" || live.playback.deadline !== expectedDeadline) return;
            this.start(live, next.id);
          }, Math.max(0, delay)),
        );
      }
    }

    for (const timer of room.timers) {
      if (timer.startMode !== "scheduled" || timer.scheduledStart == null) continue;
      const delay = timer.scheduledStart - now;
      if (delay < 0 || delay > MAX_TIMEOUT) continue;
      handles.push(
        setTimeout(() => {
          const live = this.store.get(room.id);
          if (!live) return;
          const alreadyRunning = live.activeTimerId === timer.id && live.playback.status === "running";
          if (!alreadyRunning) this.start(live, timer.id);
        }, delay),
      );
    }

    if (handles.length) this.scheduled.set(room.id, handles);
  }

  /** 서버 기동 시 저장된 방들의 예약을 복구 */
  rescheduleAll(rooms: Iterable<Room>) {
    for (const room of rooms) this.reschedule(room);
  }
}
