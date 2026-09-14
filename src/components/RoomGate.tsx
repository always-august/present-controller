"use client";
import Link from "next/link";
import { useRoomStore } from "../store/room";

/** 방을 찾지 못했거나 아직 상태를 못 받은 경우의 공통 처리 */
export function RoomGate({ children, requireController = false }: { children: React.ReactNode; requireController?: boolean }) {
  const room = useRoomStore((s) => s.room);
  const role = useRoomStore((s) => s.role);
  const notFound = useRoomStore((s) => s.notFound);
  const everConnected = useRoomStore((s) => s.everConnected);

  if (notFound) {
    return (
      <Center>
        <h1 className="text-xl font-semibold">방을 찾을 수 없어요</h1>
        <p className="mt-2 text-sm text-muted">링크가 잘못되었거나 24시간 미사용으로 정리된 방이에요.</p>
        <Link href="/" className="btn btn-primary mt-4">
          새 방 만들기
        </Link>
      </Center>
    );
  }
  if (!room) {
    return (
      <Center>
        <p className="text-sm text-muted">{everConnected ? "상태 불러오는 중…" : "연결 중…"}</p>
      </Center>
    );
  }
  if (requireController && role !== "controller") {
    return (
      <Center>
        <h1 className="text-xl font-semibold">제어 권한이 없어요</h1>
        <p className="mt-2 text-sm text-muted">
          이 화면은 <code className="rounded-md border border-line bg-panel-2 px-1.5 py-0.5 font-mono text-xs">?key=</code> 비밀키가 포함된 링크로만 열 수 있어요.
        </p>
        <Link href={`/r/${room.id}/viewer`} className="btn mt-4">
          뷰어로 열기
        </Link>
      </Center>
    );
  }
  return <>{children}</>;
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">{children}</main>;
}
