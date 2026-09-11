import { create } from "zustand";
import type { ClientEvent, Message, PublicRoom, Role, ServerEvent, Timer } from "../../shared/types";
import { RoomSocket } from "../lib/socket";

interface RoomStore {
  room: PublicRoom | null;
  role: Role;
  connected: boolean;
  everConnected: boolean;
  clockOffset: number;
  notFound: boolean;
  socket: RoomSocket | null;

  connect: (roomId: string, key: string) => void;
  disconnect: () => void;
  send: (event: ClientEvent) => void;
  applyEvent: (event: ServerEvent) => void;

  /** 서버 기준 현재 시각 */
  now: () => number;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  room: null,
  role: "viewer",
  connected: false,
  everConnected: false,
  clockOffset: 0,
  notFound: false,
  socket: null,

  connect(roomId, key) {
    get().socket?.close();
    const socket = new RoomSocket(roomId, key, {
      onEvent: (e) => get().applyEvent(e),
      onConnected: () => set({ connected: true, everConnected: true }),
      onDisconnected: () => set({ connected: false }),
      onClockOffset: (clockOffset) => set({ clockOffset }),
    });
    set({ socket, room: null, notFound: false });
    socket.connect();

    // 존재하지 않는 방이면 업그레이드가 404로 거절되므로 REST로 확인해 안내한다.
    fetch(`/api/rooms/${encodeURIComponent(roomId)}`)
      .then((r) => {
        if (r.status === 404) {
          socket.close(); // 없는 방에 재연결을 반복하지 않는다
          set({ notFound: true });
        }
      })
      .catch(() => {});
  },

  disconnect() {
    get().socket?.close();
    set({ socket: null, connected: false });
  },

  send(event) {
    get().socket?.send(event);
  },

  applyEvent(event) {
    const room = get().room;
    switch (event.type) {
      case "room:state": {
        const { role, serverTime: _serverTime, ...rest } = event.payload;
        void _serverTime;
        set({ room: rest, role, notFound: false });
        return;
      }
      case "playback:update":
        if (!room) return;
        set({ room: { ...room, playback: event.payload.playback, activeTimerId: event.payload.activeTimerId } });
        return;
      case "timers:update":
        if (!room) return;
        set({ room: { ...room, timers: event.payload } });
        return;
      case "messages:update":
        if (!room) return;
        set({ room: { ...room, messages: event.payload } });
        return;
      case "settings:update":
        if (!room) return;
        set({ room: { ...room, settings: event.payload } });
        return;
      case "error":
        console.warn("[ws] error:", event.payload.message);
        return;
    }
  },

  now: () => Date.now() + get().clockOffset,
}));

// ---- 파생 셀렉터 ----

const EMPTY_TIMERS: Timer[] = [];
const sortedCache = new WeakMap<Timer[], Timer[]>();

/** 정렬 결과를 timers 배열 identity 기준으로 캐시해, 셀렉터가 매번 새 배열을 만들지 않도록 한다. */
export const selectSortedTimers = (s: RoomStore): Timer[] => {
  if (!s.room) return EMPTY_TIMERS;
  let sorted = sortedCache.get(s.room.timers);
  if (!sorted) {
    sorted = [...s.room.timers].sort((a, b) => a.order - b.order);
    sortedCache.set(s.room.timers, sorted);
  }
  return sorted;
};

export const EMPTY_MESSAGES: Message[] = [];

export const selectActiveTimer = (s: RoomStore): Timer | null =>
  s.room?.timers.find((t) => t.id === s.room?.activeTimerId) ?? null;
