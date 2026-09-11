"use client";

const ABOUT = [
  "'마무리 부탁드립니다'의 줄임말.",
  "운영자는 노트북이나 휴대폰에서 시간을 조정하고 메시지를 띄우고,",
  "발표자는 무대 화면의 큰 숫자만 보면 됩니다.",
  "가입 없이 방을 만들고 링크만 나누면 바로 시작.",
];

/**
 * 서비스 로고 + 소개 툴팁. 마우스를 올리거나 키보드 포커스가 가면 소개가 뜬다.
 * size="lg"는 랜딩 페이지 제목용, 기본은 컨트롤러 헤더용.
 */
export function BrandMark({ size = "sm" }: { size?: "sm" | "lg" }) {
  const large = size === "lg";
  return (
    <span className={`relative inline-flex items-center gap-1.5 ${large ? "justify-center" : ""}`}>
      <span className={`font-semibold tracking-tight ${large ? "text-3xl" : "text-sm"}`}>마부</span>
      <button
        type="button"
        className={`group relative inline-flex items-center justify-center rounded-full border border-line text-muted transition hover:border-accent hover:text-white focus:border-accent focus:text-white focus:outline-none ${
          large ? "h-6 w-6 text-xs" : "h-4 w-4 text-[10px]"
        }`}
        aria-label="마부 서비스 소개"
      >
        ?
        <span
          role="tooltip"
          className={`pointer-events-none absolute z-50 w-64 rounded-lg border border-line bg-panel p-3 text-left text-xs font-normal leading-relaxed text-white/90 opacity-0 shadow-2xl transition group-hover:opacity-100 group-focus:opacity-100 ${
            large ? "left-1/2 top-full mt-2 -translate-x-1/2" : "left-0 top-full mt-2"
          }`}
        >
          <span className="mb-1 block font-semibold">마부 — 발표 타이머</span>
          {ABOUT.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </span>
      </button>
    </span>
  );
}
