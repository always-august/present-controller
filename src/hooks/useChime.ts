"use client";
import { useEffect, useRef } from "react";
import type { Phase } from "./useCountdown";

let ctx: AudioContext | null = null;

/** 사용자 제스처 안에서 호출해 오디오를 열어 둔다. */
export function unlockAudio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    /* 지원하지 않는 환경 */
  }
}

export function isAudioUnlocked() {
  return ctx?.state === "running";
}

function beep(times: number, freq: number) {
  if (!ctx || ctx.state !== "running") return;
  for (let i = 0; i < times; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime + i * 0.35;
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  }
}

/** phase가 wrapup/over로 진입하는 순간에만 울린다. */
export function useChime(phase: Phase, enabled: boolean) {
  const prev = useRef<Phase>(phase);
  useEffect(() => {
    const was = prev.current;
    prev.current = phase;
    if (!enabled || was === phase) return;
    if (phase === "wrapup" && was === "normal") beep(1, 880);
    if (phase === "over" && (was === "normal" || was === "wrapup")) beep(3, 660);
  }, [phase, enabled]);
}
