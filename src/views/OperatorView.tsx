"use client";
import { ConnectionBadge } from "../components/ConnectionBadge";
import { CurrentTimerCard } from "../components/CurrentTimerCard";
import { RoomGate } from "../components/RoomGate";
import { useRoomConnection } from "../hooks/useRoomConnection";
import { selectSortedTimers, useRoomStore } from "../store/room";

/** start/pause/next 중심의 단순 제어 화면. 휴대폰에서 한 손으로 조작하는 용도 */
export function OperatorView({ roomId, controllerKey }: { roomId: string; controllerKey: string }) {
  useRoomConnection(roomId, controllerKey);
  const timers = useRoomStore(selectSortedTimers);
  const activeId = useRoomStore((s) => s.room?.activeTimerId);
  const activeIndex = timers.findIndex((t) => t.id === activeId);
  const nextTimer = activeIndex >= 0 ? timers[activeIndex + 1] : timers[0];

  return (
    <RoomGate requireController>
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col p-3">
        <header className="mb-3 flex items-center gap-3">
          <h1 className="flex-1 text-sm font-semibold">오퍼레이터</h1>
          <ConnectionBadge />
        </header>
        <CurrentTimerCard large compact />
        <div className="mt-3 text-center text-xs text-muted">
          {activeIndex >= 0 && (
            <span>
              {activeIndex + 1} / {timers.length}
            </span>
          )}
          {nextTimer && (
            <span className="ml-2">
              다음: <span className="text-white">{nextTimer.title || "제목 없음"}</span>
            </span>
          )}
        </div>
      </div>
    </RoomGate>
  );
}
