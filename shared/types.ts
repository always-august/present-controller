// 서버와 클라이언트가 공유하는 도메인 모델

export type PlaybackStatus = "idle" | "running" | "paused";

export interface PlaybackState {
  status: PlaybackStatus;
  deadline: number | null; // running일 때 종료 예정 시각 (epoch ms, 서버 기준)
  remainingMs: number | null; // paused일 때 남은 시간
  startedAt: number | null; // count-up 모드용 시작 시각
  adjustmentMs: number; // 진행 중 가감된 누적 시간
}

export type TimerMode = "countdown" | "countup" | "clock";
export type StartMode = "manual" | "scheduled";
export type Appearance = "default" | "chroma";

export interface Timer {
  id: string;
  title: string;
  speaker: string;
  notes: string; // 내부 메모, 뷰어에는 미노출
  mode: TimerMode;
  durationMs: number;
  startMode: StartMode;
  scheduledStart: number | null;
  wrapUpMs: number; // 이 시간 이하로 남으면 경고 색상 전환 + 종료 안내 알림
  chainNext: boolean;
  appearance: Appearance;
  order: number;
}

export type MessageColor = "white" | "yellow" | "red" | "green";

export interface Message {
  id: string;
  text: string;
  color: MessageColor;
  bold: boolean;
  flash: boolean;
  visible: boolean;
  source: "operator" | "audience";
  createdAt: number;
}

export interface RoomSettings {
  showTitle: boolean;
  showSpeaker: boolean;
  showTimeOfDay: boolean;
  showProgressBar: boolean;
  chimeEnabled: boolean;
  timeFormat: "12h" | "24h";
  timezone: string;
}

export interface Room {
  id: string;
  controllerKey: string;
  name: string;
  timers: Timer[];
  messages: Message[];
  activeTimerId: string | null;
  playback: PlaybackState;
  settings: RoomSettings;
  createdAt: number;
  lastActiveAt: number;
}

// 클라이언트에 전파되는 형태. controllerKey는 제외하고, 비컨트롤러에게는 notes도 비움.
export type PublicRoom = Omit<Room, "controllerKey">;

export type Role = "controller" | "viewer";

// ---- WebSocket 이벤트 ----

export type ServerEvent =
  | { type: "room:state"; payload: PublicRoom & { role: Role; serverTime: number } }
  | { type: "playback:update"; payload: { playback: PlaybackState; activeTimerId: string | null } }
  | { type: "timers:update"; payload: Timer[] }
  | { type: "messages:update"; payload: Message[] }
  | { type: "settings:update"; payload: RoomSettings }
  | { type: "pong"; payload: { t0: number; t1: number; t2: number } }
  | { type: "error"; payload: { message: string } };

export type TimerInput = Partial<Omit<Timer, "id" | "order">>;
export type MessageInput = Partial<Omit<Message, "id" | "createdAt" | "source">>;

export type ClientEvent =
  | { type: "ping"; payload: { t0: number } }
  | { type: "playback:start"; payload: { timerId?: string } }
  | { type: "playback:pause"; payload: Record<string, never> }
  | { type: "playback:reset"; payload: Record<string, never> }
  | { type: "playback:stop"; payload: Record<string, never> }
  | { type: "playback:adjust"; payload: { deltaMs: number } }
  | { type: "playback:next"; payload: Record<string, never> }
  | { type: "playback:prev"; payload: Record<string, never> }
  | { type: "timer:create"; payload: TimerInput }
  | { type: "timer:update"; payload: { id: string } & TimerInput }
  | { type: "timer:delete"; payload: { id: string } }
  | { type: "timer:reorder"; payload: { ids: string[] } }
  | { type: "timer:import"; payload: TimerInput[] }
  | { type: "message:create"; payload: MessageInput }
  | { type: "message:update"; payload: { id: string } & MessageInput }
  | { type: "message:delete"; payload: { id: string } }
  | { type: "message:toggle"; payload: { id: string; visible?: boolean } }
  | { type: "settings:update"; payload: Partial<RoomSettings> }
  | { type: "room:rename"; payload: { name: string } };

export const DEFAULT_SETTINGS: RoomSettings = {
  showTitle: true,
  showSpeaker: true,
  showTimeOfDay: true,
  showProgressBar: true,
  chimeEnabled: true,
  timeFormat: "24h",
  timezone: "Asia/Seoul",
};

export const IDLE_PLAYBACK: PlaybackState = {
  status: "idle",
  deadline: null,
  remainingMs: null,
  startedAt: null,
  adjustmentMs: 0,
};

/**
 * 재생 상태로부터 현재 남은 시간(ms)을 계산. 클라이언트는 now = Date.now() + clockOffset을 넘긴다.
 * idle일 때는 타이머 전체 길이(+가감분)를 돌려준다.
 */
export function computeRemainingMs(
  playback: PlaybackState,
  timer: Timer | null | undefined,
  now: number,
): number {
  if (playback.status === "running" && playback.deadline != null) {
    return playback.deadline - now;
  }
  if (playback.status === "paused" && playback.remainingMs != null) {
    return playback.remainingMs;
  }
  return (timer?.durationMs ?? 0) + playback.adjustmentMs;
}

/** 타이머의 총 길이(가감 포함). 진행률 계산용 */
export function computeTotalMs(playback: PlaybackState, timer: Timer | null | undefined): number {
  return Math.max(0, (timer?.durationMs ?? 0) + playback.adjustmentMs);
}
