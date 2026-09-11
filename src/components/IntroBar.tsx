"use client";
import { useEffect, useState } from "react";
import { HelpDot, HelpList } from "./Tooltip";

const KEY = "mabu:intro-dismissed";

/**
 * 컨트롤러 하단의 첫 안내. 한 번 닫으면 이 브라우저에서는 다시 안 뜬다.
 */
export function IntroBar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(KEY) !== "1");
    } catch {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (!open) return null;
  return (
    <div className="mx-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-line bg-panel px-4 py-3 text-xs text-subtext shadow-[var(--shadow-card)]">
      <span className="font-semibold text-ink">처음이세요?</span>
      <span className="flex items-center">
        화면은 여섯 가지입니다.
        <HelpDot
          side="top"
          content={
            <HelpList
              items={[
                <><b>뷰어</b>는 발표자가 보는 화면입니다. 무대 모니터나 태블릿에 띄우세요.</>,
                <><b>컨트롤러</b>는 지금 이 화면입니다. 타이머, 재생, 메시지, 설정을 다룹니다.</>,
                <><b>오퍼레이터</b>에는 시작, 일시정지, 이전, 다음, 시간 가감만 있습니다.</>,
                <><b>모더레이터</b>는 메시지만 보냅니다.</>,
                <><b>아젠다</b>는 전체 순서와 진행 위치를 보여줍니다.</>,
                <><b>청중 질문</b>은 청중이 질문을 보내는 폼입니다.</>,
              ]}
            />
          }
        />
      </span>
      <span className="flex items-center">
        다른 기기에서도 열 수 있습니다.
        <HelpDot
          side="top"
          content={
            <HelpList
              items={[
                "우상단 링크 공유에서 QR을 찍는 게 제일 빠릅니다.",
                "뷰어는 네트워크가 끊겨도 계속 갑니다.",
              ]}
            />
          }
        />
      </span>
      <span>링크를 아는 사람은 누구나 뷰어를 볼 수 있습니다. 비밀키가 붙은 링크는 운영자끼리만 주고받으세요.</span>
      <span>24시간 동안 아무도 쓰지 않은 방은 지워집니다.</span>
      <button type="button" onClick={dismiss} className="btn btn-ghost btn-sm ml-auto" aria-label="안내 닫기">
        닫기
      </button>
    </div>
  );
}
