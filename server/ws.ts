import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocket, WebSocketServer } from "ws";
import type { ClientEvent, Role, ServerEvent } from "../shared/types";
import type { RoomEngine } from "./engine";
import { toPublicRoom, type RoomStore } from "./store";

interface Client {
  ws: WebSocket;
  role: Role;
  roomId: string;
  alive: boolean;
}

export class RoomSocketServer {
  private wss = new WebSocketServer({ noServer: true });
  private clients = new Map<string, Set<Client>>();

  constructor(
    private store: RoomStore,
    private engine: RoomEngine,
  ) {
    // 죽은 연결 정리
    setInterval(() => {
      for (const set of this.clients.values()) {
        for (const c of set) {
          if (!c.alive) {
            c.ws.terminate();
            continue;
          }
          c.alive = false;
          c.ws.ping();
        }
      }
    }, 30_000).unref();
  }

  handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer) {
    const url = new URL(req.url ?? "/", "http://localhost");
    const roomId = url.searchParams.get("room") ?? "";
    const key = url.searchParams.get("key") ?? "";
    const room = this.store.get(roomId);
    if (!room) {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
      return;
    }
    const role: Role = key && key === room.controllerKey ? "controller" : "viewer";
    this.wss.handleUpgrade(req, socket, head, (ws) => this.onConnection(ws, roomId, role));
  }

  private onConnection(ws: WebSocket, roomId: string, role: Role) {
    const client: Client = { ws, role, roomId, alive: true };
    if (!this.clients.has(roomId)) this.clients.set(roomId, new Set());
    this.clients.get(roomId)!.add(client);

    ws.on("pong", () => (client.alive = true));
    ws.on("close", () => this.clients.get(roomId)?.delete(client));
    ws.on("error", () => ws.terminate());
    ws.on("message", (raw) => this.onMessage(client, raw.toString()));

    const room = this.store.get(roomId);
    if (!room) return ws.close(4004, "room not found");
    this.send(client, {
      type: "room:state",
      payload: { ...toPublicRoom(room, role), role, serverTime: Date.now() },
    });
  }

  private onMessage(client: Client, raw: string) {
    const t1 = Date.now();
    let event: ClientEvent;
    try {
      event = JSON.parse(raw) as ClientEvent;
    } catch {
      return this.send(client, { type: "error", payload: { message: "invalid json" } });
    }

    if (event.type === "ping") {
      return this.send(client, {
        type: "pong",
        payload: { t0: Number(event.payload?.t0) || 0, t1, t2: Date.now() },
      });
    }

    const room = this.store.get(client.roomId);
    if (!room) return this.send(client, { type: "error", payload: { message: "room not found" } });
    if (client.role !== "controller") {
      return this.send(client, { type: "error", payload: { message: "controller key required" } });
    }

    const e = this.engine;
    const p = event.payload as Record<string, unknown>;
    switch (event.type) {
      case "playback:start":
        return e.start(room, typeof p.timerId === "string" ? p.timerId : undefined);
      case "playback:pause":
        return e.pause(room);
      case "playback:reset":
        return e.reset(room);
      case "playback:stop":
        return e.stop(room);
      case "playback:adjust":
        return e.adjust(room, Number(p.deltaMs));
      case "playback:next":
        return e.move(room, 1);
      case "playback:prev":
        return e.move(room, -1);
      case "timer:create":
        return e.createTimer(room, event.payload);
      case "timer:update":
        return e.updateTimer(room, event.payload.id, event.payload);
      case "timer:delete":
        return e.deleteTimer(room, event.payload.id);
      case "timer:reorder":
        return e.reorderTimers(room, Array.isArray(p.ids) ? (p.ids as string[]) : []);
      case "timer:import":
        return e.importTimers(room, Array.isArray(event.payload) ? event.payload : []);
      case "message:create":
        return e.createMessage(room, event.payload);
      case "message:update":
        return e.updateMessage(room, event.payload.id, event.payload);
      case "message:delete":
        return e.deleteMessage(room, event.payload.id);
      case "message:toggle":
        return e.toggleMessage(room, event.payload.id, event.payload.visible);
      case "settings:update":
        return e.updateSettings(room, event.payload);
      case "room:rename":
        room.name = String(event.payload.name ?? "").slice(0, 120);
        this.store.touch(room);
        return this.broadcast(room.id, {
          type: "room:state",
          payload: { ...toPublicRoom(room, "controller"), role: "controller", serverTime: Date.now() },
        });
      default:
        return this.send(client, { type: "error", payload: { message: `unknown event` } });
    }
  }

  private send(client: Client, event: ServerEvent) {
    if (client.ws.readyState !== WebSocket.OPEN) return;
    client.ws.send(JSON.stringify(event));
  }

  /** 방의 모든 클라이언트에게 전파. 역할별로 노출 범위가 다른 이벤트는 여기서 걸러낸다. */
  broadcast = (roomId: string, event: ServerEvent) => {
    const set = this.clients.get(roomId);
    if (!set) return;
    for (const client of set) {
      this.send(client, this.forRole(event, client.role));
    }
  };

  private forRole(event: ServerEvent, role: Role): ServerEvent {
    if (role === "controller") return event;
    if (event.type === "timers:update") {
      return { type: "timers:update", payload: event.payload.map((t) => ({ ...t, notes: "" })) };
    }
    if (event.type === "room:state") {
      return {
        type: "room:state",
        payload: {
          ...event.payload,
          role: "viewer",
          timers: event.payload.timers.map((t) => ({ ...t, notes: "" })),
        },
      };
    }
    return event;
  }
}
