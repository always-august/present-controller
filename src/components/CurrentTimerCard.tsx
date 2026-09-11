"use client";
import { useCountdown } from "../hooks/useCountdown";
import { formatMs } from "../lib/time";
import { selectActiveTimer, useRoomStore } from "../store/room";
import { BigTime } from "./BigTime";
import { PlaybackControls } from "./PlaybackControls";

const STATUS_LABEL = { idle: "대기", running: "진행 중", paused: "일시정지" } as const;

/** 컨트롤러/오퍼레이터 중앙의 현재 타이머 대형 표시 */
export function CurrentTimerCard({ large = false, compact = false }: { large?: boolean; compact?: boolean }) {
  const timer = useRoomStore(selectActiveTimer);
  const playback = useRoomStore((s) => s.room?.playback);
  const { remainingMs, phase, progress } = useCountdown(playback, timer);
  const status = playback?.status ?? "idle";

  const text =
    timer?.mode === "countup" ? formatMs(Math.max(0, (timer.durationMs + (playback?.adjustmentMs ?? 0)) - remainingMs)) : formatMs(remainingMs);

  return (
    <div className="card flex flex-col p-4">
      <div className="mb-2 flex items-center justify-between gap-2 text-sm">
        <div className="min-w-0 truncate">
          {timer ? (
            <>
              <span className="font-medium">{timer.title || "제목 없음"}</span>
              {timer.speaker && <span className="ml-2 text-subtext">{timer.speaker}</span>}
            </>
          ) : (
            <span className="text-muted">활성 타이머 없음</span>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
            status === "running" ? "bg-ok/15 text-ok-ink" : status === "paused" ? "bg-warn/20 text-warn-ink" : "bg-panel-2 text-subtext"
          }`}
        >
          {STATUS_LABEL[status]}
          {phase === "over" && " · 초과"}
          {phase === "wrapup" && " · 마무리"}
        </span>
      </div>
      <div className={large ? "h-[38vh] min-h-40" : "h-36"}>
        <BigTime text={timer ? text : "--:--"} phase={phase} />
      </div>
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-panel-2">
        <div
          className={`h-full transition-[width] duration-200 ${phase === "over" ? "bg-danger" : phase === "wrapup" ? "bg-warn" : "bg-accent"}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <PlaybackControls large={large} compact={compact} />
      {timer?.notes && !compact && (
        <div className="mt-4 rounded-xl bg-panel-2 p-3 text-xs text-subtext whitespace-pre-wrap">
          <span className="mb-1 block font-medium text-subtext">메모 (뷰어 미노출)</span>
          {timer.notes}
        </div>
      )}
    </div>
  );
}
