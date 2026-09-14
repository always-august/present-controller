"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import TextThree from "@/components/ui/text-three";
import { Footer } from "@/components/Footer";
import { SupportButton } from "@/components/SupportButton";

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
      if (res.status === 429) throw new Error("방을 너무 많이 만들었어요. 잠시 뒤 다시 시도해 주세요.");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { roomId, controllerKey } = (await res.json()) as { roomId: string; controllerKey: string };
      router.push(`/r/${roomId}?key=${controllerKey}`);
    } catch (e) {
      setError((e as Error).message.startsWith("HTTP") ? `방을 만들지 못했어요: ${(e as Error).message}` : (e as Error).message);
      setBusy(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="flex min-h-[1.2em] items-center justify-center text-4xl sm:text-6xl">
            <TextThree text="마무리 부탁드립니다!" speed={90} />
          </h1>
          <p className="mt-2 text-base font-medium text-subtext">발표자 타이머 컨트롤러</p>
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
        </form>
        <div className="mt-6 space-y-2 text-center text-sm leading-relaxed text-muted">
          <p>방을 만들면 고유 링크가 발급돼요.</p>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-panel-2 px-3 py-1 text-xs text-subtext">
            <span aria-hidden>🖥</span>
            PC에서 사용을 권장드려요.
          </p>
          <div className="pt-2">
            <SupportButton />
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </main>
  );
}
