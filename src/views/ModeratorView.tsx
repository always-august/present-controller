"use client";
import { ConnectionBadge } from "../components/ConnectionBadge";
import { MessagePanel } from "../components/MessagePanel";
import { RoomGate } from "../components/RoomGate";
import { useCountdown } from "../hooks/useCountdown";
import { useRoomConnection } from "../hooks/useRoomConnection";
import { formatMs } from "../lib/time";
import { selectActiveTimer, useRoomStore } from "../store/room";

export function ModeratorView({ roomId, controllerKey }: { roomId: string; controllerKey: string }) {
  useRoomConnection(roomId, controllerKey);
  const timer = useRoomStore(selectActiveTimer);
  const playback = useRoomStore((s) => s.room?.playback);
  const { remainingMs, phase } = useCountdown(playback, timer);
  const color = phase === "over" ? "text-danger-ink" : phase === "wrapup" ? "text-warn-ink" : "text-ink";

  return (
    <RoomGate requireController>
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col p-3">
        <header className="mb-3 flex items-center gap-3">
          <h1 className="flex-1 text-sm font-semibold">모더레이터 · 메시지</h1>
          <ConnectionBadge />
          <span className={`font-mono text-2xl font-semibold tnum ${color}`}>{timer ? formatMs(remainingMs) : "--:--"}</span>
        </header>
        <div className="min-h-[70vh] flex-1">
          <MessagePanel />
        </div>
      </div>
    </RoomGate>
  );
}
