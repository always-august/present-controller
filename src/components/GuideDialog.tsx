"use client";
import { Modal } from "./Modal";

const SECTIONS: { title: string; items: React.ReactNode[] }[] = [
  {
    title: "시작하기",
    items: [
      "첫 화면에서 방 만들기를 누르면 바로 컨트롤러가 열립니다. 가입은 없습니다.",
      <>컨트롤러 주소 끝에는 <code>?key=</code> 비밀키가 붙어 있습니다. 이 주소를 아는 사람은 누구나 타이머를 조작할 수 있으니 운영자끼리만 주고받으세요.</>,
      "우상단 링크 공유를 누르면 뷰어, 아젠다, 오퍼레이터 링크와 QR 코드가 나옵니다.",
    ],
  },
  {
    title: "화면은 여섯 가지",
    items: [
      <><b>뷰어</b>는 발표자가 보는 화면입니다. 무대 모니터나 태블릿에 띄우세요. 누구나 열 수 있습니다.</>,
      <><b>컨트롤러</b>는 운영자 화면입니다. 타이머 목록, 재생, 메시지, 설정을 여기서 다룹니다.</>,
      <><b>오퍼레이터</b>에는 시작, 일시정지, 이전, 다음, 시간 가감만 있습니다. 휴대폰을 한 손에 들고 쓰기 좋습니다.</>,
      <><b>모더레이터</b>는 메시지만 보냅니다. 사회자나 무대 감독이 씁니다.</>,
      <><b>아젠다</b>는 전체 순서와 지금 어디까지 왔는지 보여줍니다. 대기실이나 로비 화면에 맞습니다.</>,
      <><b>청중 질문</b>은 청중이 질문을 적어 보내는 폼입니다. 들어온 질문은 컨트롤러 메시지 패널에 쌓이고, 표시를 누르면 뷰어에 올라갑니다.</>,
    ],
  },
  {
    title: "타이머 만들기",
    items: [
      <>+ 추가로 하나씩 넣거나 CSV로 한꺼번에 불러옵니다. CSV 컬럼 순서는 <code>title, speaker, duration, notes</code>입니다.</>,
      <>길이는 <code>10:00</code>, <code>1:30:00</code>, <code>90s</code>, <code>5m</code> 어떤 식으로 적어도 됩니다.</>,
      <><b>종료 안내 시점</b>을 <code>1:00</code>으로 두면 1분 남았을 때 뷰어 숫자가 노란색으로 바뀌고 알림음과 안내 배너가 나옵니다. 0이 되면 빨간색으로 바뀌고, 그 뒤로는 <code>-00:15</code>처럼 초과한 시간이 계속 올라갑니다.</>,
      "종료 시 다음 타이머 자동 시작을 켜 두면 끝나는 순간 다음 세션으로 넘어갑니다. 예약 시작은 정해 둔 시각에 알아서 시작합니다.",
      "목록에서 끌어다 놓으면 순서가 바뀝니다. 메모는 운영자 화면에만 보입니다.",
    ],
  },
  {
    title: "진행하면서",
    items: [
      "리셋은 지금 세션을 처음 길이로 되돌립니다. 정지는 세션 선택까지 풀어 버립니다.",
      "진행 중에도 −1분, −30초, +30초, +1분, +5분 버튼으로 시간을 바로 늘리거나 줄일 수 있습니다.",
      "이전, 다음을 누르면 세션이 바뀝니다. 돌아가던 중이었다면 바뀐 세션이 곧바로 시작됩니다.",
      <>단축키는 <kbd>Space</kbd> 재생과 일시정지, <kbd>N</kbd> 다음, <kbd>P</kbd> 이전, <kbd>R</kbd> 리셋입니다.</>,
    ],
  },
  {
    title: "메시지",
    items: [
      "입력창에 적고 표시를 누르면 뷰어 아래쪽에 바로 뜹니다. 색상, 굵게, 깜빡임을 고를 수 있습니다.",
      "자주 쓰는 문구는 프리셋 저장으로 등록해 두면 한 번에 띄울 수 있습니다.",
      "메시지는 한 번에 두 개까지 보입니다. 메시지를 띄우고 지워도 타이머는 그대로 갑니다.",
    ],
  },
  {
    title: "뷰어에서",
    items: [
      "화면을 한 번 탭해야 알림음이 켜집니다. 브라우저가 첫 터치를 요구하기 때문입니다.",
      "풀스크린을 켜고 3초 동안 가만히 두면 커서와 버튼이 사라집니다.",
      "화면 꺼짐 방지는 자동으로 켜집니다. 네트워크가 끊겨도 타이머는 계속 가고, 우상단에 작은 점만 뜹니다.",
      <>주소 뒤에 <code>?chroma=green</code>을 붙이면 OBS 합성용 초록 배경이 됩니다. <code>?hideTitle=1</code>, <code>?hideClock=1</code>처럼 요소를 하나씩 숨길 수도 있습니다.</>,
    ],
  },
  {
    title: "다른 기기에서 열기",
    items: [
      "같은 Wi‑Fi에 있는 기기라면 서버가 켜진 컴퓨터의 IP 주소로 들어오면 됩니다. 링크 공유의 QR을 찍는 게 제일 빠릅니다.",
      "24시간 동안 아무도 쓰지 않은 방은 지워집니다.",
    ],
  },
];

export function GuideDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="사용 안내" wide>
      <div className="space-y-5 text-sm">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h3 className="mb-2 text-xs font-semibold text-muted">{s.title}</h3>
            <ul className="space-y-1.5">
              {s.items.map((item, i) => (
                <li key={i} className="flex gap-2 leading-relaxed">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
