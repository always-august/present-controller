"use client";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

export interface TourStep {
  /** `data-tour` 속성값 */
  target: string;
  title: string;
  body: React.ReactNode;
}

const PAD = 8;
const CARD_W = 340;
const GAP = 14;

interface Rect { top: number; left: number; width: number; height: number }

function measure(target: string): Rect | null {
  const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!el || el.offsetParent === null) return null; // display:none 이면 건너뛴다
  const r = el.getBoundingClientRect();
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

/**
 * 화면 위 요소를 하나씩 비추며 설명하는 튜토리얼.
 * 대상은 `data-tour="..."` 속성으로 표시하고, 화면에 없는 단계는 자동으로 건너뛴다.
 */
export function Tour({ steps, open, onClose }: { steps: TourStep[]; open: boolean; onClose: (dontShowAgain: boolean) => void }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [dontShow, setDontShow] = useState(true);
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);

  // 화면에 실제로 있는 단계만 남긴다
  const [visible, setVisible] = useState<number[]>([]);
  useLayoutEffect(() => {
    if (!open) return;
    const idx = steps.map((s, i) => (measure(s.target) ? i : -1)).filter((i) => i >= 0);
    setVisible(idx);
    setIndex(0);
    setDontShow(true);
  }, [open, steps]);

  const stepIdx = visible[index];
  const step = stepIdx != null ? steps[stepIdx] : undefined;
  const last = index >= visible.length - 1;

  const update = useCallback(() => {
    if (!step) return;
    setRect(measure(step.target));
    setVw(window.innerWidth);
    setVh(window.innerHeight);
  }, [step]);

  useLayoutEffect(() => {
    if (!open || !step) return;
    document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(document.body);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, step, update]);

  const finish = useCallback(() => onClose(true), [onClose]);
  const skip = useCallback(() => onClose(dontShow), [onClose, dontShow]);
  const next = useCallback(() => (last ? finish() : setIndex((i) => i + 1)), [last, finish]);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") prev();
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, skip, next, prev]);

  if (!open || !step || !rect) return null;

  // 카드 위치: 아래 → 위 → 오른쪽 → 가운데 순으로 들어갈 자리를 찾는다
  const cardH = 220;
  let top: number;
  let left = rect.left + rect.width / 2 - CARD_W / 2;
  if (rect.top + rect.height + GAP + cardH <= vh) top = rect.top + rect.height + GAP;
  else if (rect.top - GAP - cardH >= 0) top = rect.top - GAP - cardH;
  else if (rect.left + rect.width + GAP + CARD_W <= vw) {
    top = Math.max(12, Math.min(rect.top, vh - cardH - 12));
    left = rect.left + rect.width + GAP;
  } else top = Math.max(12, vh / 2 - cardH / 2);
  left = Math.max(12, Math.min(left, vw - CARD_W - 12));

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal aria-label="튜토리얼" onMouseDown={(e) => e.stopPropagation()}>
      {/* 스포트라이트: 대상만 밝게, 나머지는 어둡게 */}
      <div
        className="pointer-events-none absolute rounded-2xl ring-2 ring-accent transition-all duration-300 ease-[var(--ease-smooth)]"
        style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, boxShadow: "0 0 0 200vmax rgba(25, 31, 40, 0.55)" }}
      />
      <div
        className="card animate-pop-in absolute flex flex-col gap-3 p-5 shadow-[var(--shadow-card-hover)] transition-all duration-300 ease-[var(--ease-smooth)]"
        style={{ top, left, width: CARD_W }}
      >
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-base font-semibold">{step.title}</h3>
          <span className="shrink-0 text-xs tnum text-muted">
            {index + 1} / {visible.length}
          </span>
        </div>
        <div className="text-sm leading-relaxed text-subtext">{step.body}</div>
        <div className="mt-1 flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
            <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} />
            다시 보지 않기
          </label>
          <button type="button" className="btn btn-ghost btn-sm ml-auto" onClick={skip}>
            건너뛰기
          </button>
          <button type="button" className="btn btn-sm" onClick={prev} disabled={index === 0}>
            이전
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={next}>
            {last ? "완료" : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 이 브라우저에서 튜토리얼을 이미 봤는지 */
export function useTourSeen(key: string) {
  const [seen, setSeen] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      setSeen(localStorage.getItem(key) === "1");
    } catch {
      setSeen(true);
    }
  }, [key]);
  const markSeen = useCallback(() => {
    setSeen(true);
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
  }, [key]);
  return { seen, markSeen };
}
