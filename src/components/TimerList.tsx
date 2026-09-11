"use client";
import { useState } from "react";
import type { Timer } from "../../shared/types";
import { formatScheduled, msToClockInput } from "../lib/time";
import { selectSortedTimers, useRoomStore } from "../store/room";

export function TimerList({ onEdit, onAdd, onImport }: { onEdit: (t: Timer) => void; onAdd: () => void; onImport: () => void }) {
  const timers = useRoomStore(selectSortedTimers);
  const activeId = useRoomStore((s) => s.room?.activeTimerId);
  const status = useRoomStore((s) => s.room?.playback.status);
  const timezone = useRoomStore((s) => s.room?.settings.timezone ?? "Asia/Seoul");
  const send = useRoomStore((s) => s.send);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const drop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const ids = timers.map((t) => t.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    send({ type: "timer:reorder", payload: { ids } });
  };

  return (
    <div className="card flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">
          타이머 <span className="text-muted">{timers.length}</span>
        </h2>
        <div className="flex gap-1">
          <button className="btn btn-sm" onClick={onImport} title="CSV 임포트">
            CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={onAdd}>
            + 추가
          </button>
        </div>
      </div>
      <ul className="flex-1 overflow-y-auto p-2">
        {timers.length === 0 && (
          <li className="p-6 text-center text-sm text-muted">
            타이머를 추가하세요.
            <br />
            드래그로 순서를 바꿀 수 있습니다.
          </li>
        )}
        {timers.map((t, i) => {
          const active = t.id === activeId;
          return (
            <li
              key={t.id}
              draggable
              onDragStart={() => setDragId(t.id)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverId(t.id);
              }}
              onDragLeave={() => setOverId(null)}
              onDrop={() => {
                drop(t.id);
                setDragId(null);
                setOverId(null);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className={`group mb-1 flex cursor-grab items-center gap-2 rounded-lg border px-2 py-2 transition ${
                active ? "border-accent/60 bg-accent/10" : "border-transparent hover:bg-panel-2"
              } ${overId === t.id && dragId !== t.id ? "border-t-2 border-t-accent" : ""} ${dragId === t.id ? "opacity-40" : ""}`}
            >
              <span className="w-5 shrink-0 text-center text-xs text-muted tnum">{i + 1}</span>
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => onEdit(t)}
                title="클릭하여 편집"
              >
                <div className="truncate text-sm font-medium">{t.title || <span className="text-muted">제목 없음</span>}</div>
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                  {t.speaker && <span className="truncate">{t.speaker}</span>}
                  <span className="font-mono tnum">{t.mode === "clock" ? "시계" : msToClockInput(t.durationMs)}</span>
                  {t.mode === "countup" && <span>▲ 카운트업</span>}
                  {t.chainNext && <span title="종료 시 다음 타이머 자동 시작">⛓ 자동 연결</span>}
                  {t.startMode === "scheduled" && t.scheduledStart && (
                    <span title="예약 시작">⏰ {formatScheduled(t.scheduledStart, timezone)}</span>
                  )}
                </div>
              </button>
              <button
                className={`btn btn-sm shrink-0 ${active && status === "running" ? "btn-danger" : ""}`}
                onClick={() =>
                  active && status === "running"
                    ? send({ type: "playback:pause", payload: {} })
                    : send({ type: "playback:start", payload: { timerId: t.id } })
                }
                title={active && status === "running" ? "일시정지" : "이 타이머 시작"}
              >
                {active && status === "running" ? "❚❚" : "▶"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
