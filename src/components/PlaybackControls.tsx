"use client";
import { useRoomStore } from "../store/room";

const ADJUSTMENTS = [
  { label: "−1분", deltaMs: -60_000 },
  { label: "−30초", deltaMs: -30_000 },
  { label: "+30초", deltaMs: 30_000 },
  { label: "+1분", deltaMs: 60_000 },
  { label: "+5분", deltaMs: 300_000 },
];

export function PlaybackControls({ compact = false, large = false }: { compact?: boolean; large?: boolean }) {
  const send = useRoomStore((s) => s.send);
  const status = useRoomStore((s) => s.room?.playback.status ?? "idle");
  const hasTimers = useRoomStore((s) => (s.room?.timers.length ?? 0) > 0);
  const running = status === "running";
  const size = large ? "px-5 py-4 text-lg" : "";

  return (
    <div className="space-y-3">
      <div className={`flex flex-wrap items-center justify-center gap-2 ${large ? "gap-3" : ""}`}>
        <button className={`btn ${size}`} onClick={() => send({ type: "playback:prev", payload: {} })} disabled={!hasTimers} title="이전 타이머 (P)">
          ⏮ 이전
        </button>
        <button
          className={`btn ${running ? "btn-danger" : "btn-primary"} min-w-32 ${size}`}
          onClick={() => send({ type: running ? "playback:pause" : "playback:start", payload: {} })}
          disabled={!hasTimers}
          title="시작 / 일시정지 (Space)"
        >
          {running ? "❚❚ 일시정지" : status === "paused" ? "▶ 재개" : "▶ 시작"}
        </button>
        <button className={`btn ${size}`} onClick={() => send({ type: "playback:next", payload: {} })} disabled={!hasTimers} title="다음 타이머 (N)">
          다음 ⏭
        </button>
        {!compact && (
          <>
            <button className={`btn ${size}`} onClick={() => send({ type: "playback:reset", payload: {} })} disabled={!hasTimers} title="리셋 (R)">
              ↺ 리셋
            </button>
            <button className={`btn ${size}`} onClick={() => send({ type: "playback:stop", payload: {} })} disabled={!hasTimers} title="정지 (활성 타이머 해제)">
              ■ 정지
            </button>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {ADJUSTMENTS.map((a) => (
          <button
            key={a.deltaMs}
            className={`btn tnum ${large ? "px-4 py-3" : "btn-sm"}`}
            onClick={() => send({ type: "playback:adjust", payload: { deltaMs: a.deltaMs } })}
            disabled={!hasTimers}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
