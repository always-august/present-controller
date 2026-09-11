"use client";
import { useId } from "react";

/**
 * 마우스를 올리거나 키보드 포커스가 가면 짧은 설명이 뜨는 툴팁.
 * text 대신 content를 주면 목록 같은 여러 줄 내용도 넣을 수 있다.
 */
export function Tooltip({
  text,
  content,
  children,
  side = "top",
  align = "center",
  wide = false,
  className = "",
}: {
  text?: string;
  content?: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom";
  /** start는 왼쪽 정렬. 모달 왼쪽 가장자리처럼 가운데 정렬이 잘리는 곳에 쓴다 */
  align?: "center" | "start" | "end";
  /** 여러 줄 안내용 넓은 말풍선 */
  wide?: boolean;
  className?: string;
}) {
  const id = useId();
  const vertical = side === "top" ? "bottom-full mb-2" : "top-full mt-2";
  const horizontal = align === "center" ? "left-1/2 -translate-x-1/2" : align === "start" ? "left-0" : "right-0";
  return (
    <span className={`group/tip relative inline-flex ${className}`} aria-describedby={id}>
      {children}
      <span
        id={id}
        role="tooltip"
        className={`pointer-events-none absolute z-50 rounded-lg bg-ink px-3 py-2 text-left text-[11px] font-normal leading-relaxed text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100 ${vertical} ${horizontal} ${
          wide ? "w-72" : "w-max max-w-56"
        }`}
      >
        {content ?? text}
      </span>
    </span>
  );
}

/** 라벨이나 패널 제목 옆에 붙이는 작은 물음표 */
export function HelpDot({
  text,
  content,
  side = "bottom",
  align = "start",
  wide,
}: {
  text?: string;
  content?: React.ReactNode;
  side?: "top" | "bottom";
  align?: "center" | "start" | "end";
  wide?: boolean;
}) {
  return (
    <Tooltip text={text} content={content} side={side} align={align} wide={wide ?? Boolean(content)} className="ml-1 align-middle">
      <button
        type="button"
        tabIndex={0}
        aria-label="도움말"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-line text-[10px] leading-none text-muted hover:border-accent hover:text-accent focus:border-accent focus:text-accent focus:outline-none"
      >
        ?
      </button>
    </Tooltip>
  );
}

/** 여러 줄 안내를 툴팁 안에 목록으로 보여줄 때 */
export function HelpList({ title, items }: { title?: string; items: React.ReactNode[] }) {
  return (
    <span className="block">
      {title && <span className="mb-1 block font-semibold">{title}</span>}
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-white/60" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </span>
  );
}
