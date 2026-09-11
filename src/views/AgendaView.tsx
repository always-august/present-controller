"use client";
import { ConnectionBadge } from "../components/ConnectionBadge";
import { RoomGate } from "../components/RoomGate";
import { useCountdown } from "../hooks/useCountdown";
import { useRoomConnection } from "../hooks/useRoomConnection";
import { formatClock, formatMs, formatScheduled, humanDuration } from "../lib/time";
import { selectActiveTimer, selectSortedTimers, useRoomStore } from "../store/room";
import { useEffect, useState } from "react";

export function AgendaView({ roomId }: { roomId: string }) {
  useRoomConnection(roomId);
  const room = useRoomStore((s) => s.room);
  const timers = useRoomStore(selectSortedTimers);
  const active = useRoomStore(selectActiveTimer);
  const now = useRoomStore((s) => s.now);
  const { remainingMs, phase } = useCountdown(room?.playback, active);
  const [clock, setClock] = useState("");

  useEffect(() => {
    if (!room) return;
    const tick = () => setClock(formatClock(now(), room.settings.timeFormat, room.settings.timezone));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [room, now]);

  const activeIndex = timers.findIndex((t) => t.id === active?.id);
  const status = room?.playback.status ?? "idle";
  const color = phase === "over" ? "text-danger" : phase === "wrapup" ? "text-warn" : "text-white";

  return (
    <RoomGate>
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{room?.name}</h1>
            <p className="text-xs text-muted">아젠다 · {timers.length}개 세션</p>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl tnum">{clock}</div>
            <ConnectionBadge />
          </div>
        </header>

        {active && (
          <div className="card mb-4 flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <div className="text-xs text-muted">{status === "running" ? "진행 중" : status === "paused" ? "일시정지" : "대기"}</div>
              <div className="truncate text-lg font-semibold">{active.title || "제목 없음"}</div>
              {active.speaker && <div className="truncate text-sm text-muted">{active.speaker}</div>}
            </div>
            <div className={`font-mono text-4xl font-semibold tnum ${color}`}>{formatMs(remainingMs)}</div>
          </div>
        )}

        <ol className="space-y-1">
          {timers.map((t, i) => {
            const state = i < activeIndex ? "done" : i === activeIndex ? "current" : "upcoming";
            return (
              <li
                key={t.id}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                  state === "current" ? "border-accent/60 bg-accent/10" : state === "done" ? "border-transparent opacity-50" : "border-line"
                }`}
              >
                <span className="w-6 text-center text-xs text-muted tnum">{state === "done" ? "✓" : i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{t.title || "제목 없음"}</div>
                  <div className="truncate text-xs text-muted">
                    {t.speaker}
                    {t.startMode === "scheduled" && t.scheduledStart && (
                      <span className="ml-2">⏰ {formatScheduled(t.scheduledStart, room?.settings.timezone ?? "Asia/Seoul")}</span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-muted tnum">{humanDuration(t.durationMs)}</span>
              </li>
            );
          })}
          {timers.length === 0 && <li className="p-6 text-center text-sm text-muted">등록된 세션이 없습니다.</li>}
        </ol>
      </div>
    </RoomGate>
  );
}
