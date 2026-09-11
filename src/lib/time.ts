/** 남은 ms를 표시용 문자열로. 양수는 올림(시작 직후 전체 길이 표시), 음수는 내림(초과분). */
export function formatMs(ms: number, opts: { forceHours?: boolean; showSign?: boolean } = {}): string {
  const negative = ms < 0;
  const seconds = negative ? Math.floor(-ms / 1000) : Math.ceil(ms / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const body = h > 0 || opts.forceHours ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  const sign = negative ? "-" : opts.showSign ? "+" : "";
  return `${sign}${body}`;
}

/** 편집 폼용. "MM:SS" 또는 "H:MM:SS" (항상 올림 없이 정확한 값) */
export function msToClockInput(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/**
 * 사람이 입력한 길이 문자열을 ms로. 실패 시 null.
 *  "10"  → 10분, "10:30" → 10분 30초, "1:05:00" → 1시간 5분,
 *  "90s" → 90초, "5m" → 5분, "1h" → 1시간, "1h30m" → 90분
 */
export function parseDuration(input: string): number | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;

  if (/^\d+(\.\d+)?$/.test(s)) return Math.round(parseFloat(s) * 60_000);

  const clock = s.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
  if (clock) {
    const [, a, b, c] = clock;
    if (c !== undefined) return (Number(a) * 3600 + Number(b) * 60 + Number(c)) * 1000;
    return (Number(a) * 60 + Number(b)) * 1000;
  }

  const units = s.match(/^(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?$/);
  if (units && (units[1] || units[2] || units[3])) {
    return (Number(units[1] ?? 0) * 3600 + Number(units[2] ?? 0) * 60 + Number(units[3] ?? 0)) * 1000;
  }
  return null;
}

export function formatClock(now: number, timeFormat: "12h" | "24h", timezone: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: timeFormat === "12h",
      timeZone: timezone,
    }).format(new Date(now));
  } catch {
    return new Date(now).toLocaleTimeString();
  }
}

export function formatScheduled(ts: number, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleString();
  }
}

/** 사람이 읽기 좋은 길이 ("1시간 5분", "10분", "30초") */
export function humanDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h}시간`);
  if (m) parts.push(`${m}분`);
  if (s || parts.length === 0) parts.push(`${s}초`);
  return parts.join(" ");
}
