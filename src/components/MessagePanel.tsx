"use client";
import { useState } from "react";
import type { Message, MessageColor } from "../../shared/types";
import { EMPTY_MESSAGES, useRoomStore } from "../store/room";
import { HelpDot, HelpList, Tooltip } from "./Tooltip";

const COLORS: { value: MessageColor; label: string; className: string }[] = [
  { value: "white", label: "흰색", className: "bg-white border-line" },
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
  white: "text-ink",
  yellow: "text-warn-ink",
  red: "text-danger-ink",
  green: "text-ok-ink",
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
        <h2 className="flex items-center text-sm font-semibold">
          메시지
          <HelpDot
            content={
              <HelpList
                title="메시지"
                items={[
                  "입력창에 적고 표시를 누르면 뷰어 아래쪽에 바로 뜹니다.",
                  "색상, 굵게, 깜빡임을 고를 수 있습니다.",
                  "자주 쓰는 문구는 프리셋 저장으로 등록해 두세요.",
                  "한 번에 두 개까지 보입니다. 띄우고 지워도 타이머는 그대로 갑니다.",
                  "청중 질문 폼으로 들어온 질문도 여기 쌓입니다. 표시를 누르면 뷰어에 올라갑니다.",
                ]}
              />
            }
          />
          {visibleCount > 0 && <span className="ml-1 rounded-full bg-ok/15 px-2 py-0.5 text-xs font-medium text-ok-ink">{visibleCount} 표시 중</span>}
        </h2>
        {visibleCount > 0 && (
          <Tooltip text="뷰어에 떠 있는 메시지를 전부 내립니다. 목록에는 남습니다">
            <button
              className="btn btn-sm"
              onClick={() => messages.filter((m) => m.visible).forEach((m) => send({ type: "message:toggle", payload: { id: m.id, visible: false } }))}
            >
              모두 숨김
            </button>
          </Tooltip>
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
          <Tooltip text="적은 메시지를 뷰어 아래쪽에 바로 띄웁니다. Enter로도 됩니다">
            <button className="btn btn-primary shrink-0" type="submit" disabled={!text.trim()}>
              표시
            </button>
          </Tooltip>
        </form>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex gap-1">
            {COLORS.map((c) => (
              <Tooltip key={c.value} text={`${c.label} 글자로 띄웁니다`}>
              <button
                type="button"
                onClick={() => setColor(c.value)}
                className={`h-6 w-6 rounded-full border ${c.className} ${color === c.value ? "ring-2 ring-accent ring-offset-2 ring-offset-panel" : "border-line opacity-70 hover:opacity-100"}`}
              />
              </Tooltip>
            ))}
          </div>
          <Tooltip text="글자를 굵게 띄웁니다. 멀리서도 잘 보입니다">
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={bold} onChange={(e) => setBold(e.target.checked)} /> 굵게
            </label>
          </Tooltip>
          <Tooltip text="1초 간격으로 깜빡여서 눈에 띄게 합니다">
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={flash} onChange={(e) => setFlash(e.target.checked)} /> 깜빡임
            </label>
          </Tooltip>
          <Tooltip text="지금 적은 문구를 프리셋으로 남깁니다. 이 브라우저에 저장됩니다" className="ml-auto">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => text.trim() && !presets.includes(text.trim()) && savePresets([...presets, text.trim()])}
              disabled={!text.trim()}
            >
              프리셋 저장
            </button>
          </Tooltip>
        </div>
        <div className="flex flex-wrap gap-1">
          {presets.map((p) => (
            <span key={p} className="group inline-flex items-center overflow-hidden rounded-full border border-transparent bg-panel-2 text-xs font-medium text-subtext transition hover:border-line">
              <button type="button" className="px-3 py-1.5 hover:text-ink" onClick={() => show(p)} title="누르면 이 문구가 바로 뷰어에 뜹니다">
                {p}
              </button>
              <button
                type="button"
                className="hidden pr-2.5 py-1.5 text-muted hover:text-danger group-hover:block"
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
      <Tooltip text={m.visible ? "뷰어에서 내립니다" : "뷰어에 띄웁니다. 두 개까지 같이 보입니다"}>
        <button
          className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${m.visible ? "bg-ok text-white" : "bg-panel-2 text-subtext hover:text-ink"}`}
          onClick={() => send({ type: "message:toggle", payload: { id: m.id } })}
        >
          {m.visible ? "표시 중" : "표시"}
        </button>
      </Tooltip>
      <span className={`min-w-0 flex-1 truncate text-sm ${TEXT_COLOR[m.color]} ${m.bold ? "font-semibold" : ""}`} title={m.text}>
        {m.source === "audience" && <span className="mr-1 text-xs text-muted">Q</span>}
        {m.text}
      </span>
      {m.flash && <span className="text-xs text-muted" title="깜빡임">⚡</span>}
      <Tooltip text="목록에서 지웁니다">
        <button className="btn btn-ghost btn-sm text-muted" onClick={() => send({ type: "message:delete", payload: { id: m.id } })}>
          ✕
        </button>
      </Tooltip>
    </div>
  );
}
