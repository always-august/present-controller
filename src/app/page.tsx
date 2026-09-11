"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import TextThree from "@/components/ui/text-three";
import { GuideDialog } from "@/components/GuideDialog";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

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
          <button type="button" className="btn btn-ghost w-full text-muted" onClick={() => setGuideOpen(true)}>
            사용 안내
          </button>
        </form>
        <GuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} />
        <ul className="mt-6 space-y-1.5 text-xs text-muted">
          <li>· 가입 없이 즉시 사용. 컨트롤러 링크(비밀키 포함)는 운영자만 보관하세요.</li>
          <li>· 뷰어는 네트워크가 끊겨도 로컬 계산으로 계속 카운트합니다.</li>
          <li>· 24시간 동안 사용하지 않은 방은 자동 정리됩니다.</li>
        </ul>
      </div>
    </main>
  );
}
