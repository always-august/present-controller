import type { IncomingMessage } from "node:http";

/**
 * IP당 고정 윈도 카운터. 공개 엔드포인트(방 생성, 청중 질문)가 봇에 두드려지는 걸 막는 최소 장치.
 * 프로세스 하나라 인메모리로 충분하고, 오래된 항목은 주기적으로 비운다.
 */
export class RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private limit: number,
    private windowMs: number,
  ) {
    setInterval(() => {
      const now = Date.now();
      for (const [k, v] of this.hits) if (v.resetAt <= now) this.hits.delete(k);
    }, windowMs).unref();
  }

  /** 허용되면 true. 거절되면 false와 함께 몇 초 뒤 다시 가능한지 돌려준다 */
  check(key: string): { ok: boolean; retryAfterSec: number } {
    const now = Date.now();
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return { ok: true, retryAfterSec: 0 };
    }
    if (entry.count >= this.limit) {
      return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
    }
    entry.count++;
    return { ok: true, retryAfterSec: 0 };
  }
}

/** 프록시(Railway, Cloudflare) 뒤에서도 실제 클라이언트 IP를 잡는다 */
export function clientIp(req: IncomingMessage): string {
  const cf = req.headers["cf-connecting-ip"];
  if (typeof cf === "string" && cf) return cf;
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff) return xff.split(",")[0].trim();
  return req.socket.remoteAddress ?? "unknown";
}
