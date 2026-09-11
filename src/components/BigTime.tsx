"use client";
import { useEffect, useRef, useState } from "react";
import type { Phase } from "../hooks/useCountdown";

// idle/normal은 부모 글자색을 그대로 쓴다 (컨트롤러는 어두운 잉크, 뷰어는 흰색)
const PHASE_COLOR: Record<Phase, string | undefined> = {
  idle: undefined,
  normal: undefined,
  wrapup: "#f5c542",
  over: "#ff4d4f",
};

/**
 * 컨테이너 크기에 맞춰 숫자 폰트 크기를 자동 계산한다. 고정 폰트 크기를 쓰지 않는다.
 * 등폭 폰트라 글자당 폭이 일정하므로 (컨테이너 폭 / 글자수)로 계산할 수 있다.
 */
export function BigTime({ text, phase, className = "" }: { text: string; phase: Phase; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(64);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      const chars = Math.max(text.length, 5);
      // Geist Mono 글자 폭 ≈ 0.6em, 행 높이 ≈ 1em
      const byWidth = (width * 0.96) / (chars * 0.6);
      const byHeight = height * 0.9;
      setFontSize(Math.max(16, Math.floor(Math.min(byWidth, byHeight))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text.length]);

  return (
    <div ref={ref} className={`flex h-full w-full items-center justify-center ${className}`}>
      <span
        className="font-mono font-semibold tnum leading-none tracking-tight transition-colors duration-300"
        style={{ fontSize, color: PHASE_COLOR[phase] }}
      >
        {text}
      </span>
    </div>
  );
}
