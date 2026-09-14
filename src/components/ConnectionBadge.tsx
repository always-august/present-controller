"use client";
import { useRoomStore } from "../store/room";

export function ConnectionBadge({ minimal = false }: { minimal?: boolean }) {
  const connected = useRoomStore((s) => s.connected);
  const everConnected = useRoomStore((s) => s.everConnected);
  const offset = useRoomStore((s) => s.clockOffset);

  if (minimal) {
    // 뷰어용: 끊겼을 때만 우상단에 작은 점
    if (connected) return null;
    return (
      <div
        className="pointer-events-none fixed right-3 top-3 z-40 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 text-[11px] text-white/70"
        title="연결 끊김. 재연결 중이며 타이머는 계속 동작해요"
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-danger" />
        {everConnected ? "재연결 중" : "연결 중"}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-subtext" title={`시계 보정 ${offset > 0 ? "+" : ""}${Math.round(offset)}ms`}>
      <span className={`h-2 w-2 rounded-full ${connected ? "bg-ok" : "animate-pulse bg-danger"}`} />
      {connected ? "연결됨" : everConnected ? "재연결 중…" : "연결 중…"}
    </div>
  );
}
