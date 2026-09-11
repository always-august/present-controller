"use client";
import { useState } from "react";
import { Footer } from "../components/Footer";

export function AskView({ roomId }: { roomId: string }) {
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async () => {
    if (!text.trim()) return;
    setState("sending");
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (!res.ok) throw new Error();
      setText("");
      setState("sent");
    } catch {
      setState("error");
    }
  };

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center p-6">
      <form
        className="card w-full max-w-md space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div>
          <h1 className="text-lg font-semibold">질문 보내기</h1>
          <p className="text-xs text-muted">운영자가 확인 후 무대 화면에 띄울 수 있습니다.</p>
        </div>
        <textarea className="input min-h-32" value={text} onChange={(e) => setText(e.target.value)} placeholder="질문을 입력하세요" maxLength={300} />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted tnum">{text.length}/300</span>
          <button className="btn btn-primary" type="submit" disabled={state === "sending" || !text.trim()}>
            {state === "sending" ? "보내는 중…" : "보내기"}
          </button>
        </div>
        {state === "sent" && <p className="text-sm text-ok">질문이 전달되었습니다.</p>}
        {state === "error" && <p className="text-sm text-danger">전송에 실패했습니다. 다시 시도해 주세요.</p>}
      </form>
      </div>
      <Footer />
    </main>
  );
}
