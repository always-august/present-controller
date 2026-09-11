"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { computeRemainingMs, computeTotalMs, type PlaybackState, type Timer } from "../../shared/types";
import { useRoomStore } from "../store/room";

export type Phase = "idle" | "normal" | "wrapup" | "over";

export interface CountdownState {
  remainingMs: number;
  totalMs: number;
  /** 진행률 0~1 (초과 시 1) */
  progress: number;
  phase: Phase;
}

/**
 * requestAnimationFrame 기반 렌더링 루프. 서버 틱 없이 deadline과 clockOffset만으로 로컬 계산한다.
 * 리렌더는 100ms 단위로 값이 바뀔 때만 발생시켜 부하를 줄인다.
 * 탭이 백그라운드로 갔다가 돌아와도 절대 시각 기준이므로 점프 없이 이어진다.
 */
export function useCountdown(playback: PlaybackState | undefined, timer: Timer | null | undefined): CountdownState {
  const clockOffset = useRoomStore((s) => s.clockOffset);
  const [tick, setTick] = useState(0);
  const lastBucket = useRef<number | null>(null);

  useEffect(() => {
    if (!playback) return;
    let raf = 0;
    const loop = () => {
      const remaining = computeRemainingMs(playback, timer, Date.now() + clockOffset);
      const bucket = Math.floor(remaining / 100);
      if (bucket !== lastBucket.current) {
        lastBucket.current = bucket;
        setTick((t) => t + 1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // 백그라운드 탭에서는 rAF가 멈추므로 복귀 시 즉시 한 번 갱신
    const onVisible = () => setTick((t) => t + 1);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [playback, timer, clockOffset]);

  return useMemo(() => {
    void tick;
    if (!playback) return { remainingMs: 0, totalMs: 0, progress: 0, phase: "idle" };
    const remainingMs = computeRemainingMs(playback, timer, Date.now() + clockOffset);
    const totalMs = computeTotalMs(playback, timer);
    const progress = totalMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / totalMs)) : 0;

    let phase: Phase = "normal";
    if (playback.status === "idle") phase = "idle";
    else if (remainingMs <= 0) phase = "over";
    else if (timer && timer.wrapUpMs > 0 && remainingMs <= timer.wrapUpMs) phase = "wrapup";

    return { remainingMs, totalMs, progress, phase };
  }, [tick, playback, timer, clockOffset]);
}
