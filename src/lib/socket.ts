import type { ClientEvent, ServerEvent } from "../../shared/types";

export interface SocketHandlers {
  onEvent: (event: ServerEvent) => void;
  onConnected: () => void;
  onDisconnected: () => void;
  onClockOffset: (offset: number) => void;
}

const SYNC_SAMPLES = 5;
const SYNC_GAP_MS = 150;
const RESYNC_INTERVAL_MS = 30_000;
const MAX_BACKOFF_MS = 5_000;

/**
 * 방 WebSocket 연결. 지수 백오프 재연결과 NTP 방식 시계 보정을 담당한다.
 * 재연결되면 서버가 room:state를 다시 보내므로 클라이언트는 그걸로 상태를 덮어쓰기만 하면 된다.
 */
export class RoomSocket {
  private ws: WebSocket | null = null;
  private closed = false;
  private attempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private resyncTimer: ReturnType<typeof setInterval> | null = null;
  private samples: { offset: number; rtt: number }[] = [];
  private pendingPings = new Map<number, number>();

  constructor(
    private roomId: string,
    private key: string,
    private handlers: SocketHandlers,
  ) {}

  connect() {
    if (this.closed) return;
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${location.host}/ws?room=${encodeURIComponent(this.roomId)}${
      this.key ? `&key=${encodeURIComponent(this.key)}` : ""
    }`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.attempts = 0;
      this.handlers.onConnected();
      this.syncClock();
      this.resyncTimer = setInterval(() => this.syncClock(), RESYNC_INTERVAL_MS);
    };
    ws.onmessage = (ev) => {
      let event: ServerEvent;
      try {
        event = JSON.parse(ev.data as string) as ServerEvent;
      } catch {
        return;
      }
      if (event.type === "pong") return this.onPong(event.payload);
      this.handlers.onEvent(event);
    };
    ws.onclose = () => {
      if (this.resyncTimer) clearInterval(this.resyncTimer);
      this.resyncTimer = null;
      this.handlers.onDisconnected();
      this.scheduleReconnect();
    };
    ws.onerror = () => ws.close();
  }

  private scheduleReconnect() {
    if (this.closed || this.reconnectTimer) return;
    const delay = Math.min(MAX_BACKOFF_MS, 500 * 2 ** this.attempts) + Math.random() * 200;
    this.attempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  close() {
    this.closed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.resyncTimer) clearInterval(this.resyncTimer);
    this.ws?.close();
    this.ws = null;
  }

  send(event: ClientEvent) {
    if (this.ws?.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify(event));
    return true;
  }

  // ---- 시계 보정 ----
  // 5회 ping 후 왕복 지연이 가장 짧은 샘플의 offset을 채택한다.

  private syncClock() {
    this.samples = [];
    for (let i = 0; i < SYNC_SAMPLES; i++) {
      setTimeout(() => {
        const t0 = Date.now();
        this.pendingPings.set(t0, t0);
        this.send({ type: "ping", payload: { t0 } });
      }, i * SYNC_GAP_MS);
    }
  }

  private onPong({ t0, t1, t2 }: { t0: number; t1: number; t2: number }) {
    if (!this.pendingPings.has(t0)) return;
    this.pendingPings.delete(t0);
    const t3 = Date.now();
    const rtt = t3 - t0 - (t2 - t1);
    const offset = (t1 - t0 + (t2 - t3)) / 2;
    this.samples.push({ offset, rtt });
    if (this.samples.length >= SYNC_SAMPLES) {
      const best = this.samples.reduce((a, b) => (b.rtt < a.rtt ? b : a));
      this.handlers.onClockOffset(best.offset);
    } else if (this.samples.length === 1) {
      // 첫 샘플로 일단 보정해 두고 나머지 샘플이 모이면 정밀값으로 교체
      this.handlers.onClockOffset(offset);
    }
  }
}
