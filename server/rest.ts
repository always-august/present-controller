import type { IncomingMessage, ServerResponse } from "node:http";
import type { MessageColor, Room } from "../shared/types";
import type { RoomEngine } from "./engine";
import { clientIp, RateLimiter } from "./rateLimit";
import { toPublicRoom, type RoomStore } from "./store";

// 방 생성: IP당 10분에 10개. 청중 질문: IP당 1분에 5개
const createLimiter = new RateLimiter(10, 10 * 60 * 1000);
const questionLimiter = new RateLimiter(5, 60 * 1000);

/**
 * 외부 도구(Stream Deck 등) 연동용 최소 REST.
 * 처리했으면 true, /api 경로가 아니면 false를 돌려주고 Next로 넘긴다.
 */
export function createRestHandler(store: RoomStore, engine: RoomEngine) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (!url.pathname.startsWith("/api/")) return false;

    const json = (status: number, body: unknown) => {
      res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      });
      res.end(JSON.stringify(body));
    };

    if (req.method === "OPTIONS") {
      json(204, {});
      return true;
    }

    const parts = url.pathname.split("/").filter(Boolean); // ["api", "rooms", id, action, ...]
    if (parts[1] !== "rooms") {
      json(404, { error: "not found" });
      return true;
    }

    const body = await readBody(req);

    // POST /api/rooms
    if (parts.length === 2 && req.method === "POST") {
      const rl = createLimiter.check(clientIp(req));
      if (!rl.ok) {
        res.setHeader("Retry-After", String(rl.retryAfterSec));
        json(429, { error: "too many rooms created, try again later" });
        return true;
      }
      const room = store.create(typeof body.name === "string" ? body.name : undefined);
      json(201, { roomId: room.id, controllerKey: room.controllerKey });
      return true;
    }

    const room = store.get(parts[2] ?? "");
    if (!room) {
      json(404, { error: "room not found" });
      return true;
    }
    const action = parts[3];

    // GET /api/rooms/:id (공개)
    if (!action && req.method === "GET") {
      json(200, { ...toPublicRoom(room, "viewer"), serverTime: Date.now() });
      return true;
    }

    // POST /api/rooms/:id/questions (공개)
    if (action === "questions" && req.method === "POST") {
      const rl = questionLimiter.check(clientIp(req));
      if (!rl.ok) {
        res.setHeader("Retry-After", String(rl.retryAfterSec));
        json(429, { error: "too many questions, try again later" });
        return true;
      }
      const text = String(body.text ?? "").trim();
      if (!text) {
        json(400, { error: "text required" });
        return true;
      }
      const msg = engine.createMessage(room, { text: text.slice(0, 300), color: "white" }, "audience");
      json(201, { id: msg.id });
      return true;
    }

    // 이하 컨트롤러 권한 필요
    const key = url.searchParams.get("key") ?? (typeof body.key === "string" ? body.key : "");
    if (key !== room.controllerKey) {
      json(403, { error: "invalid controller key" });
      return true;
    }

    const ok = () => json(200, { ok: true, playback: room.playback, activeTimerId: room.activeTimerId });
    const isPost = req.method === "POST";

    switch (action) {
      case "start":
        if (!isPost) break;
        engine.start(room, typeof body.timerId === "string" ? body.timerId : undefined);
        return ok(), true;
      case "pause":
        if (!isPost) break;
        engine.pause(room);
        return ok(), true;
      case "toggle":
        if (!isPost) break;
        engine.toggle(room);
        return ok(), true;
      case "reset":
        if (!isPost) break;
        engine.reset(room);
        return ok(), true;
      case "stop":
        if (!isPost) break;
        engine.stop(room);
        return ok(), true;
      case "next":
        if (!isPost) break;
        engine.move(room, 1);
        return ok(), true;
      case "prev":
        if (!isPost) break;
        engine.move(room, -1);
        return ok(), true;
      case "adjust":
        if (!isPost) break;
        engine.adjust(room, Number(body.deltaMs));
        return ok(), true;
      case "message": {
        const msgId = parts[4];
        if (isPost && !msgId) {
          const msg = engine.createMessage(room, {
            text: String(body.text ?? ""),
            color: (["white", "yellow", "red", "green"].includes(String(body.color))
              ? body.color
              : "white") as MessageColor,
            flash: Boolean(body.flash),
            bold: Boolean(body.bold),
            visible: body.visible === undefined ? true : Boolean(body.visible),
          });
          json(201, msg);
          return true;
        }
        if (req.method === "DELETE" && msgId) {
          engine.deleteMessage(room, msgId);
          json(200, { ok: true });
          return true;
        }
        break;
      }
    }

    json(404, { error: "unknown action" });
    return true;
  };
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  if (req.method === "GET" || req.method === "OPTIONS") return {};
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > 64 * 1024) return {};
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export type { Room };
