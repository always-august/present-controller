"use client";
import { useId } from "react";

/**
 * 마우스를 올리거나 키보드 포커스가 가면 짧은 설명이 뜨는 툴팁.
 * 감싸는 요소가 버튼이면 그 버튼에 aria-describedby를 붙여 스크린리더도 읽을 수 있다.
 */
export function Tooltip({
  text,
  children,
  side = "top",
  align = "center",
  className = "",
}: {
  text: string;
  children: React.ReactNode;
  side?: "top" | "bottom";
  /** start는 왼쪽 정렬. 모달 왼쪽 가장자리처럼 가운데 정렬이 잘리는 곳에 쓴다 */
  align?: "center" | "start";
  className?: string;
}) {
  const id = useId();
  const vertical = side === "top" ? "bottom-full mb-2" : "top-full mt-2";
  const horizontal = align === "center" ? "left-1/2 -translate-x-1/2" : "left-0";
  const pos = `${vertical} ${horizontal}`;
  return (
    <span className={`group/tip relative inline-flex ${className}`} aria-describedby={id}>
      {children}
      <span
        id={id}
        role="tooltip"
        className={`pointer-events-none absolute z-50 w-max max-w-56 rounded-lg bg-ink px-2.5 py-1.5 text-left text-[11px] font-normal leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100 ${pos}`}
      >
        {text}
      </span>
    </span>
  );
}

/** 폼 라벨 옆에 붙이는 작은 물음표. 라벨 자체는 건드리지 않는다. */
export function HelpDot({ text }: { text: string }) {
  return (
    <Tooltip text={text} side="bottom" align="start" className="ml-1 align-middle">
      <button
        type="button"
        tabIndex={-1}
        aria-label="도움말"
        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-line text-[9px] leading-none text-muted hover:border-accent hover:text-accent"
      >
        ?
      </button>
    </Tooltip>
  );
}
