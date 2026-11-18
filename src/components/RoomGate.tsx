"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
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
        <SlowHint />
      </Center>
    );
  }
  if (requireController && role !== "controller") {
    return (
      <Center>
        <h1 className="text-xl font-semibold">어드민 권한이 없어요</h1>
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

/** 연결이 8초 넘게 안 되면 흔한 원인을 보여준다 */
function SlowHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShow(true), 8000);
    return () => clearTimeout(id);
  }, []);
  if (!show) return null;
  const host = typeof window === "undefined" ? "" : window.location.host;
  return (
    <div className="mt-6 max-w-sm rounded-xl border border-line bg-panel-2 p-4 text-left text-xs leading-relaxed text-subtext">
      <p className="mb-2 font-semibold text-ink">연결이 안 되고 있어요</p>
      <ul className="list-disc space-y-1 pl-4">
        <li>서버가 켜진 컴퓨터와 같은 Wi‑Fi에 연결돼 있는지 확인해 주세요. 게스트 Wi‑Fi는 따로 분리돼 있을 수 있어요.</li>
        <li>
          지금 주소는 <span className="font-mono">{host}</span>예요. 다른 기기에서 열었는데 <span className="font-mono">localhost</span>라면 서버 컴퓨터의 IP 주소로 다시 열어 주세요.
        </li>
        <li>서버 컴퓨터가 잠자기에 들어가지 않았는지 확인해 주세요.</li>
      </ul>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">{children}</main>;
}
