"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import TextThree from "@/components/ui/text-three";
import { HelpDot, HelpList } from "@/components/Tooltip";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoom = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { roomId, controllerKey } = (await res.json()) as { roomId: string; controllerKey: string };
      router.push(`/r/${roomId}?key=${controllerKey}`);
    } catch (e) {
      setError(`방을 만들지 못했습니다: ${(e as Error).message}`);
      setBusy(false);
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="flex min-h-[1.2em] items-center justify-center text-4xl sm:text-6xl">
            <TextThree text="마무리 부탁드립니다!" speed={90} />
          </h1>
          <p className="mt-2 text-base font-medium text-subtext">발표자 타이머 컨트롤러</p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            방을 만들면 바로 링크가 발급됩니다.
            <br />
            노트북에서 제어하고, 무대 화면에서는 뷰어 링크를 여세요.
          </p>
        </div>
        <form
          className="card p-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void createRoom();
          }}
        >
          <div>
            <label className="label" htmlFor="name">
              행사 이름 (선택)
              <HelpDot
                content={
                  <HelpList
                    title="시작하기"
                    items={[
                      "방 만들기를 누르면 바로 컨트롤러가 열립니다. 가입은 없습니다.",
                      "컨트롤러 주소 끝의 ?key= 비밀키를 아는 사람은 누구나 조작할 수 있으니 운영자끼리만 주고받으세요.",
                      "이름은 나중에 설정에서 바꿀 수 있습니다.",
                    ]}
                  />
                }
              />
            </label>
            <input
              id="name"
              className="input"
              placeholder="예: 2026 개발자 컨퍼런스 오전 세션"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
            />
          </div>
          <button className="btn btn-primary w-full py-3 text-base" disabled={busy} type="submit">
            {busy ? "만드는 중…" : "방 만들기"}
          </button>
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
        <ul className="mt-6 space-y-1.5 text-xs text-muted">
          <li className="flex items-center">
            · 화면은 여섯 가지입니다.
            <HelpDot
              side="top"
              content={
                <HelpList
                  items={[
                    <><b>뷰어</b>는 발표자가 보는 화면입니다. 무대 모니터나 태블릿에 띄우세요.</>,
                    <><b>컨트롤러</b>는 운영자 화면입니다. 타이머, 재생, 메시지, 설정을 다룹니다.</>,
                    <><b>오퍼레이터</b>에는 시작, 일시정지, 이전, 다음, 시간 가감만 있습니다.</>,
                    <><b>모더레이터</b>는 메시지만 보냅니다.</>,
                    <><b>아젠다</b>는 전체 순서와 진행 위치를 보여줍니다.</>,
                    <><b>청중 질문</b>은 청중이 질문을 보내는 폼입니다.</>,
                  ]}
                />
              }
            />
          </li>
          <li className="flex items-center">
            · 다른 기기에서도 열 수 있습니다.
            <HelpDot
              side="top"
              content={
                <HelpList
                  items={[
                    "같은 Wi‑Fi에 있는 기기라면 서버가 켜진 컴퓨터의 IP 주소로 들어오면 됩니다.",
                    "링크 공유의 QR을 찍는 게 제일 빠릅니다.",
                    "뷰어는 네트워크가 끊겨도 계속 갑니다.",
                  ]}
                />
              }
            />
          </li>
          <li>· 24시간 동안 아무도 쓰지 않은 방은 지워집니다.</li>
        </ul>
      </div>
    </main>
  );
}
