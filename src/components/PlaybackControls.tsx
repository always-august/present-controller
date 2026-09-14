"use client";
import { useRoomStore } from "../store/room";
import { Tooltip } from "./Tooltip";

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
        <Tooltip text="앞 세션으로 넘어가요. 돌아가던 중이면 바로 시작돼요. 단축키 P">
          <button className={`btn ${size}`} onClick={() => send({ type: "playback:prev", payload: {} })} disabled={!hasTimers}>
            ⏮ 이전
          </button>
        </Tooltip>
        <Tooltip text={running ? "잠깐 멈춰요. 남은 시간은 그대로 둬요. 단축키 Space" : "지금 세션을 시작해요. 단축키 Space"}>
          <button
            className={`btn ${running ? "btn-danger" : "btn-primary"} min-w-32 ${size}`}
            onClick={() => send({ type: running ? "playback:pause" : "playback:start", payload: {} })}
            disabled={!hasTimers}
          >
            {running ? "❚❚ 일시정지" : status === "paused" ? "▶ 재개" : "▶ 시작"}
          </button>
        </Tooltip>
        <Tooltip text="다음 세션으로 넘어가요. 돌아가던 중이면 바로 시작돼요. 단축키 N">
          <button className={`btn ${size}`} onClick={() => send({ type: "playback:next", payload: {} })} disabled={!hasTimers}>
            다음 ⏭
          </button>
        </Tooltip>
        {!compact && (
          <>
            <Tooltip text="지금 세션을 처음 길이로 되돌려요. 단축키 R">
              <button className={`btn ${size}`} onClick={() => send({ type: "playback:reset", payload: {} })} disabled={!hasTimers}>
                ↺ 리셋
              </button>
            </Tooltip>
            <Tooltip text="타이머를 멈추고 세션 선택도 풀어요. 뷰어에는 --:--가 떠요">
              <button className={`btn ${size}`} onClick={() => send({ type: "playback:stop", payload: {} })} disabled={!hasTimers}>
                ■ 정지
              </button>
            </Tooltip>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {ADJUSTMENTS.map((a) => (
          <Tooltip key={a.deltaMs} text={`남은 시간을 ${a.label.replace("−", "")} ${a.deltaMs < 0 ? "줄여요" : "늘려요"}. 진행 중에도 바로 반영돼요`}>
            <button
              className={`btn tnum ${large ? "px-4 py-3" : "btn-sm"}`}
              onClick={() => send({ type: "playback:adjust", payload: { deltaMs: a.deltaMs } })}
              disabled={!hasTimers}
            >
              {a.label}
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
