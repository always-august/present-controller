"use client";
import { Children } from "react";
import { Tour, type TourStep } from "./Tour";

/** 항목 하나에 불릿 하나 */
function Bullets({ children }: { children: React.ReactNode }) {
  return (
    <ul className="space-y-1.5">
      {Children.map(children, (c, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-muted" aria-hidden />
          <span className="min-w-0">{c}</span>
        </li>
      ))}
    </ul>
  );
}

export const CONTROLLER_TOUR_KEY = "mabu:tour:controller:v1";

const STEPS: TourStep[] = [
  {
    target: "timers",
    title: "타이머 목록",
    body: (
      <Bullets>
        <><b>+ 추가</b> 하나씩 넣어요</>
        <><b>CSV</b> 한꺼번에 불러와요</>
        <><b>항목 클릭</b> 편집해요</>
        <><b>끌어다 놓기</b> 순서를 바꿔요</>
        <><b>▶</b> 그 세션을 바로 시작해요</>
      </Bullets>
    ),
  },
  {
    target: "current",
    title: "현재 세션",
    body: (
      <Bullets>
        <>뷰어와 같은 숫자가 떠요</>
        <><b className="text-warn-ink">노란색</b> 종료 안내 시점에 들어섰어요</>
        <><b className="text-danger-ink">빨간색</b> 시간을 넘겼어요. 초과 시간이 계속 올라가요</>
      </Bullets>
    ),
  },
  {
    target: "playback",
    title: "재생 제어",
    body: (
      <Bullets>
        <><b>시작·일시정지</b> <kbd>Space</kbd></>
        <><b>이전·다음</b> <kbd>P</kbd> <kbd>N</kbd></>
        <><b>리셋</b> 처음 길이로 되돌려요 <kbd>R</kbd></>
        <><b>정지</b> 세션 선택까지 풀어요</>
      </Bullets>
    ),
  },
  {
    target: "adjust",
    title: "시간 가감",
    body: (
      <Bullets>
        <>진행 중에도 바로 늘리고 줄여요</>
        <>뷰어 숫자도 같이 바뀌어요</>
      </Bullets>
    ),
  },
  {
    target: "messages",
    title: "메시지",
    body: (
      <Bullets>
        <><b>표시</b> 뷰어 아래쪽에 바로 떠요</>
        <><b>색상·굵게·깜빡임</b> 골라서 띄워요</>
        <><b>프리셋</b> 자주 쓰는 문구를 저장해요</>
        <>한 번에 두 개까지 보여요</>
        <>청중 질문도 여기 쌓여요</>
      </Bullets>
    ),
  },
  {
    target: "share",
    title: "링크 공유",
    body: (
      <Bullets>
        <><b>뷰어</b> 무대 화면이나 발표자 태블릿용이에요</>
        <><b>청중 질문</b> 청중에게 나눠 줘요</>
        <><b>어드민</b> 운영자끼리만 주고받아요</>
        <>링크마다 QR이 있어요</>
      </Bullets>
    ),
  },
  {
    target: "settings",
    title: "설정",
    body: (
      <Bullets>
        <>행사 이름을 바꿔요</>
        <>뷰어에 보일 요소와 알림음을 골라요</>
        <>튜토리얼은 헤더의 <b>튜토리얼</b> 버튼으로 다시 볼 수 있어요</>
      </Bullets>
    ),
  },
];

export function ControllerTour({ open, onClose }: { open: boolean; onClose: (dontShowAgain: boolean) => void }) {
  return <Tour steps={STEPS} open={open} onClose={onClose} />;
}
