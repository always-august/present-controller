import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { PublicRoom, Role, Room } from "../shared/types";
import { DEFAULT_SETTINGS, IDLE_PLAYBACK } from "../shared/types";
import { newControllerKey, newRoomId } from "./ids";

const SNAPSHOT_INTERVAL_MS = 5_000;
const EXPIRY_MS = 24 * 60 * 60 * 1000;
const EXPIRY_CHECK_MS = 10 * 60 * 1000;
// 공개 서비스에서 방이 무한히 쌓이는 걸 막는 상한. 넘으면 가장 오래 쉰 방부터 지운다
const MAX_ROOMS = Number(process.env.MAX_ROOMS ?? 2000);

/**
 * 방 상태는 인메모리 Map이 단일 진실. SQLite는 5초 주기 스냅샷용이며 재시작 시 복구에만 쓰인다.
 */
export class RoomStore {
  private rooms = new Map<string, Room>();
  private dirty = new Set<string>();
  private db: DatabaseSync;
  private onExpire: (roomId: string) => void = () => {};

  constructor(dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data")) {
    this.db = this.openDatabase(dataDir);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        last_active INTEGER NOT NULL
      )
    `);
    this.load();
    setInterval(() => this.snapshot(), SNAPSHOT_INTERVAL_MS).unref();
    setInterval(() => this.expire(), EXPIRY_CHECK_MS).unref();
  }

  /**
   * 지정한 경로에 DB를 열고, 권한 문제 등으로 실패하면 임시 디렉터리로 물러난다.
   * 볼륨 마운트가 잘못돼도 서비스가 통째로 죽는 것보다는 스냅샷 없이라도 도는 게 낫다.
   */
  private openDatabase(dataDir: string): DatabaseSync {
    try {
      mkdirSync(dataDir, { recursive: true });
      return new DatabaseSync(path.join(dataDir, "rooms.db"));
    } catch (err) {
      const fallback = path.join(tmpdir(), "mabu-data");
      console.error(`[store] cannot open ${dataDir} (${(err as Error).message}); falling back to ${fallback}. Rooms will NOT survive a restart.`);
      mkdirSync(fallback, { recursive: true });
      return new DatabaseSync(path.join(fallback, "rooms.db"));
    }
  }

  setExpiryHandler(fn: (roomId: string) => void) {
    this.onExpire = fn;
  }

  private load() {
    const rows = this.db.prepare("SELECT data FROM rooms").all() as { data: string }[];
    for (const row of rows) {
      try {
        const room = JSON.parse(row.data) as Room;
        // 재시작 직후에는 진행 중이던 타이머를 일시정지 상태로 복구한다.
        // deadline 기준으로 계속 흐르게 두면 서버 다운 시간만큼 어긋나므로 운영자가 다시 시작하도록 한다.
        if (room.playback.status === "running" && room.playback.deadline != null) {
          room.playback = {
            ...room.playback,
            status: "paused",
            remainingMs: Math.max(0, room.playback.deadline - Date.now()),
            deadline: null,
          };
        }
        this.rooms.set(room.id, room);
      } catch (err) {
        console.error("[store] failed to parse room row", err);
      }
    }
    console.log(`[store] loaded ${this.rooms.size} room(s)`);
  }

  private snapshot() {
    if (this.dirty.size === 0) return;
    const upsert = this.db.prepare(
      "INSERT INTO rooms (id, data, last_active) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, last_active = excluded.last_active",
    );
    const del = this.db.prepare("DELETE FROM rooms WHERE id = ?");
    for (const id of this.dirty) {
      const room = this.rooms.get(id);
      if (room) upsert.run(id, JSON.stringify(room), room.lastActiveAt);
      else del.run(id);
    }
    this.dirty.clear();
  }

  private expire() {
    const cutoff = Date.now() - EXPIRY_MS;
    for (const room of this.rooms.values()) {
      if (room.lastActiveAt < cutoff && room.playback.status !== "running") {
        this.rooms.delete(room.id);
        this.dirty.add(room.id);
        this.onExpire(room.id);
        console.log(`[store] expired room ${room.id}`);
      }
    }
  }

  create(name = "새 발표"): Room {
    this.evictIfFull();
    const now = Date.now();
    const room: Room = {
      id: newRoomId(),
      controllerKey: newControllerKey(),
      name,
      timers: [],
      messages: [],
      activeTimerId: null,
      playback: { ...IDLE_PLAYBACK },
      settings: { ...DEFAULT_SETTINGS },
      createdAt: now,
      lastActiveAt: now,
    };
    this.rooms.set(room.id, room);
    this.dirty.add(room.id);
    return room;
  }

  private evictIfFull() {
    if (this.rooms.size < MAX_ROOMS) return;
    const idle = [...this.rooms.values()]
      .filter((r) => r.playback.status !== "running")
      .sort((a, b) => a.lastActiveAt - b.lastActiveAt);
    for (const room of idle.slice(0, Math.max(1, Math.ceil(MAX_ROOMS * 0.05)))) {
      this.rooms.delete(room.id);
      this.dirty.add(room.id);
      this.onExpire(room.id);
    }
    console.log(`[store] evicted idle rooms, now ${this.rooms.size}`);
  }

  get(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  /** 변경 후 반드시 호출. 활동 시각 갱신 + 스냅샷 대상 표시 */
  touch(room: Room) {
    room.lastActiveAt = Date.now();
    this.dirty.add(room.id);
  }

  flush() {
    this.snapshot();
  }
}

/** 클라이언트에 보낼 수 있는 형태로 변환. 비밀키는 항상 제거, 뷰어에게는 내부 메모도 제거 */
export function toPublicRoom(room: Room, role: Role): PublicRoom {
  const { controllerKey: _key, ...rest } = room;
  void _key;
  return {
    ...rest,
    timers: role === "controller" ? rest.timers : rest.timers.map((t) => ({ ...t, notes: "" })),
  };
}
