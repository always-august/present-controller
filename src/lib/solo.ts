import type { PlaybackState, Timer } from "../../shared/types";

/** 솔로 모드 설정. 이 브라우저에만 저장된다 */
export interface SoloSettings {
  title: string;
  durationMs: number;
  wrapUpMs: number;
  chime: boolean;
  countup: boolean;
}

export const SOLO_KEY = "mabu:solo:settings";

export const DEFAULT_SOLO: SoloSettings = { title: "", durationMs: 15 * 60_000, wrapUpMs: 60_000, chime: true, countup: false };

export function loadSoloSettings(): SoloSettings {
  try {
    const raw = localStorage.getItem(SOLO_KEY);
    return raw ? { ...DEFAULT_SOLO, ...JSON.parse(raw) } : DEFAULT_SOLO;
  } catch {
    return DEFAULT_SOLO;
  }
}

export function saveSoloSettings(s: SoloSettings) {
  try {
    localStorage.setItem(SOLO_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export const IDLE_PLAYBACK: PlaybackState = { status: "idle", deadline: null, remainingMs: null, startedAt: null, adjustmentMs: 0 };

/** 설정을 뷰어가 이해하는 Timer 객체로 바꾼다 */
export function toTimer(s: SoloSettings): Timer {
  return {
    id: "solo",
    title: s.title,
    speaker: "",
    notes: "",
    mode: s.countup ? "countup" : "countdown",
    durationMs: s.durationMs,
    startMode: "manual",
    scheduledStart: null,
    wrapUpMs: s.wrapUpMs,
    chainNext: false,
    appearance: "default",
    order: 0,
  };
}

/** 서버의 재생 로직을 브라우저 안에서 그대로 재현한다 */
export function soloStart(p: PlaybackState, timer: Timer, now: number): PlaybackState {
  if (p.status === "running") return p;
  const remaining = p.status === "paused" && p.remainingMs != null ? p.remainingMs : timer.durationMs + p.adjustmentMs;
  return { ...p, status: "running", deadline: now + remaining, remainingMs: null, startedAt: p.startedAt ?? now };
}
export function soloPause(p: PlaybackState, now: number): PlaybackState {
  if (p.status !== "running" || p.deadline == null) return p;
  return { ...p, status: "paused", remainingMs: p.deadline - now, deadline: null };
}
export function soloReset(): PlaybackState {
  return IDLE_PLAYBACK;
}
export function soloAdjust(p: PlaybackState, deltaMs: number): PlaybackState {
  if (p.status === "running" && p.deadline != null) return { ...p, deadline: p.deadline + deltaMs, adjustmentMs: p.adjustmentMs + deltaMs };
  if (p.status === "paused" && p.remainingMs != null) return { ...p, remainingMs: p.remainingMs + deltaMs, adjustmentMs: p.adjustmentMs + deltaMs };
  return { ...p, adjustmentMs: p.adjustmentMs + deltaMs };
}
