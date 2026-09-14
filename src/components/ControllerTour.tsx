"use client";
import { Children } from "react";
import { Tour, type TourStep } from "./Tour";

/** 문장 하나에 한 줄씩 */
function Lines({ children }: { children: React.ReactNode }) {
  return (
    <span className="block space-y-1">
      {Children.map(children, (c, i) => (
        <span key={i} className="block">
          {c}
        </span>
      ))}
    </span>
  );
}

export const CONTROLLER_TOUR_KEY = "mabu:tour:controller:v1";

const STEPS: TourStep[] = [
  {
    target: "timers",
    title: "타이머 목록",
    body: (
      <Lines>
        <>발표 순서대로 세션을 넣어요.</>
        <><b>+ 추가</b>로 하나씩 넣거나 <b>CSV</b>로 한꺼번에 불러와요.</>
        <>항목을 누르면 편집 창이 열리고, 끌어다 놓으면 순서가 바뀌어요.</>
        <><b>▶</b>를 누르면 그 세션이 바로 시작돼요.</>
        <>세션마다 <b>종료 안내 시점</b>을 정해 두면 그만큼 남았을 때 뷰어가 노란색으로 바뀌고 알림이 울려요.</>
      </Lines>
    ),
  },
  {
    target: "current",
    title: "현재 세션",
    body: (
      <Lines>
        <>지금 진행 중인 세션과 남은 시간이에요.</>
        <>발표자가 보는 뷰어에도 같은 숫자가 떠요.</>
        <>종료 안내 시점부터 노란색으로 바뀌어요.</>
        <>0을 지나면 빨간색으로 바뀌고 초과 시간이 계속 올라가요.</>
      </Lines>
    ),
  },
  {
    target: "playback",
    title: "재생 제어",
    body: (
      <Lines>
        <><b>시작</b>과 <b>일시정지</b>, <b>이전</b>과 <b>다음</b> 세션으로 이동해요.</>
        <><b>리셋</b>은 지금 세션을 처음 길이로 되돌려요.</>
        <><b>정지</b>는 세션 선택까지 풀어요.</>
        <>단축키는 <kbd>Space</kbd> 재생·일시정지, <kbd>N</kbd> 다음, <kbd>P</kbd> 이전, <kbd>R</kbd> 리셋이에요.</>
      </Lines>
    ),
  },
  {
    target: "adjust",
    title: "시간 가감",
    body: (
      <Lines>
        <>발표가 길어지거나 짧아지면 여기서 바로 늘리고 줄여요.</>
        <>진행 중에도 즉시 반영되고, 뷰어 숫자도 같이 바뀌어요.</>
      </Lines>
    ),
  },
  {
    target: "messages",
    title: "메시지",
    body: (
      <Lines>
        <>발표자에게 보낼 말이에요.</>
        <>적고 <b>표시</b>를 누르면 뷰어 아래쪽에 떠요.</>
        <>색상, 굵게, 깜빡임을 고를 수 있어요.</>
        <>자주 쓰는 문구는 <b>프리셋</b>으로 저장해 두세요.</>
        <>한 번에 두 개까지 보여요.</>
        <>청중 질문 폼으로 들어온 질문도 여기 쌓여요.</>
      </Lines>
    ),
  },
  {
    target: "share",
    title: "링크 공유",
    body: (
      <Lines>
        <>뷰어, 아젠다, 오퍼레이터, 모더레이터, 청중 질문 링크와 QR 코드가 여기 있어요.</>
        <><b>뷰어</b>는 무대 화면에, <b>오퍼레이터</b>는 휴대폰에 띄우면 좋아요.</>
        <>비밀키가 붙은 링크는 운영자끼리만 주고받으세요.</>
      </Lines>
    ),
  },
  {
    target: "settings",
    title: "설정",
    body: (
      <Lines>
        <>행사 이름, 뷰어에 보일 요소, 알림음, 시간 형식을 바꿔요.</>
        <>이 튜토리얼은 헤더의 <b>튜토리얼</b> 버튼으로 언제든 다시 볼 수 있어요.</>
      </Lines>
    ),
  },
];

export function ControllerTour({ open, onClose }: { open: boolean; onClose: (dontShowAgain: boolean) => void }) {
  return <Tour steps={STEPS} open={open} onClose={onClose} />;
}
