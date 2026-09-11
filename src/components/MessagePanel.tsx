"use client";
import { useState } from "react";
import type { Message, MessageColor } from "../../shared/types";
import { EMPTY_MESSAGES, useRoomStore } from "../store/room";

const COLORS: { value: MessageColor; label: string; className: string }[] = [
  { value: "white", label: "흰색", className: "bg-white" },
  { value: "yellow", label: "노랑", className: "bg-warn" },
  { value: "red", label: "빨강", className: "bg-danger" },
  { value: "green", label: "초록", className: "bg-ok" },
];

const PRESET_KEY = "mabu:presets";
const DEFAULT_PRESETS = ["마무리해 주세요", "5분 남았습니다", "시간이 종료되었습니다", "마이크를 가까이 대주세요", "Q&A 시작"];

function loadPresets(): string[] {
  try {
    const raw = localStorage.getItem(PRESET_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    /* ignore */
  }
  return DEFAULT_PRESETS;
}

const TEXT_COLOR: Record<MessageColor, string> = {
  white: "text-white",
  yellow: "text-warn",
  red: "text-danger",
  green: "text-ok",
};

export function MessagePanel() {
  const messages = useRoomStore((s) => s.room?.messages ?? EMPTY_MESSAGES);
  const send = useRoomStore((s) => s.send);
  const [text, setText] = useState("");
  const [color, setColor] = useState<MessageColor>("white");
  const [bold, setBold] = useState(true);
  const [flash, setFlash] = useState(false);
  const [presets, setPresets] = useState<string[]>(() => (typeof window === "undefined" ? DEFAULT_PRESETS : loadPresets()));

  const savePresets = (next: string[]) => {
    setPresets(next);
    try {
      localStorage.setItem(PRESET_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const show = (t: string, visible = true) => {
    const trimmed = t.trim();
    if (!trimmed) return;
    send({ type: "message:create", payload: { text: trimmed, color, bold, flash, visible } });
    setText("");
  };

  const operatorMessages = messages.filter((m) => m.source === "operator").sort((a, b) => b.createdAt - a.createdAt);
  const questions = messages.filter((m) => m.source === "audience").sort((a, b) => b.createdAt - a.createdAt);
  const visibleCount = messages.filter((m) => m.visible).length;

  return (
    <div className="card flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">
          메시지 {visibleCount > 0 && <span className="ml-1 rounded-full bg-ok/20 px-1.5 text-xs text-ok">{visibleCount} 표시 중</span>}
        </h2>
        {visibleCount > 0 && (
          <button
            className="btn btn-sm"
            onClick={() => messages.filter((m) => m.visible).forEach((m) => send({ type: "message:toggle", payload: { id: m.id, visible: false } }))}
          >
            모두 숨김
          </button>
        )}
      </div>

      <div className="space-y-2 border-b border-line p-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            show(text);
          }}
        >
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="발표자에게 보낼 메시지" maxLength={500} />
          <button className="btn btn-primary shrink-0" type="submit" disabled={!text.trim()}>
            표시
          </button>
        </form>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex gap-1">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => setColor(c.value)}
                className={`h-6 w-6 rounded-full border-2 ${c.className} ${color === c.value ? "border-white ring-2 ring-accent" : "border-transparent opacity-60"}`}
              />
            ))}
          </div>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={bold} onChange={(e) => setBold(e.target.checked)} /> 굵게
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={flash} onChange={(e) => setFlash(e.target.checked)} /> 깜빡임
          </label>
          <button
            type="button"
            className="btn btn-ghost btn-sm ml-auto"
            onClick={() => text.trim() && !presets.includes(text.trim()) && savePresets([...presets, text.trim()])}
            disabled={!text.trim()}
          >
            프리셋 저장
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {presets.map((p) => (
            <span key={p} className="group inline-flex items-center overflow-hidden rounded-md border border-line bg-panel-2 text-xs">
              <button type="button" className="px-2 py-1 hover:bg-[#252b3c]" onClick={() => show(p)} title="바로 표시">
                {p}
              </button>
              <button
                type="button"
                className="hidden px-1.5 py-1 text-muted hover:text-danger group-hover:block"
                onClick={() => savePresets(presets.filter((x) => x !== p))}
                title="프리셋 삭제"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {questions.length > 0 && (
          <>
            <div className="px-2 pt-1 pb-1 text-xs font-medium text-muted">청중 질문 {questions.length}</div>
            {questions.map((m) => (
              <MessageRow key={m.id} m={m} />
            ))}
            <div className="mt-2 border-t border-line" />
          </>
        )}
        {operatorMessages.length === 0 && questions.length === 0 && (
          <p className="p-4 text-center text-xs text-muted">아직 메시지가 없습니다.</p>
        )}
        {operatorMessages.map((m) => (
          <MessageRow key={m.id} m={m} />
        ))}
      </div>
    </div>
  );
}

function MessageRow({ m }: { m: Message }) {
  const send = useRoomStore((s) => s.send);
  return (
    <div className={`mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 ${m.visible ? "bg-ok/10" : "hover:bg-panel-2"}`}>
      <button
        className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${m.visible ? "bg-ok text-black" : "bg-panel-2 text-muted"}`}
        onClick={() => send({ type: "message:toggle", payload: { id: m.id } })}
        title={m.visible ? "숨기기" : "표시"}
      >
        {m.visible ? "표시 중" : "표시"}
      </button>
      <span className={`min-w-0 flex-1 truncate text-sm ${TEXT_COLOR[m.color]} ${m.bold ? "font-semibold" : ""}`} title={m.text}>
        {m.source === "audience" && <span className="mr-1 text-xs text-muted">Q</span>}
        {m.text}
      </span>
      {m.flash && <span className="text-xs text-muted" title="깜빡임">⚡</span>}
      <button className="btn btn-ghost btn-sm text-muted" onClick={() => send({ type: "message:delete", payload: { id: m.id } })} title="삭제">
        ✕
      </button>
    </div>
  );
}
