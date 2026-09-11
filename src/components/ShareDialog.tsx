"use client";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { HelpDot, HelpList } from "./Tooltip";

interface LinkDef {
  label: string;
  desc: string;
  path: string;
  secret?: boolean;
  help?: React.ReactNode[];
}

export function ShareDialog({ open, onClose, roomId, controllerKey }: { open: boolean; onClose: () => void; roomId: string; controllerKey: string }) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const k = `?key=${controllerKey}`;
  const links: LinkDef[] = [
    {
      label: "뷰어",
      desc: "발표자가 보는 풀스크린 타이머. 누구나 열 수 있습니다",
      path: `/r/${roomId}/viewer`,
      help: [
        "무대 모니터나 태블릿에 띄우세요.",
        "화면을 한 번 탭해야 알림음이 켜집니다.",
        "풀스크린을 켜고 3초 두면 커서와 버튼이 사라집니다.",
        "화면 꺼짐 방지는 자동으로 켜집니다. 네트워크가 끊겨도 계속 갑니다.",
        <>주소 뒤에 <code className="bg-white/15 text-white">?chroma=green</code>을 붙이면 OBS용 초록 배경, <code className="bg-white/15 text-white">?hideTitle=1</code>처럼 요소를 숨길 수 있습니다.</>,
      ],
    },
    {
      label: "아젠다",
      desc: "전체 순서와 지금 어디까지 왔는지. 누구나 열 수 있습니다",
      path: `/r/${roomId}/agenda`,
      help: ["대기실이나 로비 화면에 맞습니다.", "지난 세션은 흐리게, 지금 세션은 파란 테두리로 표시됩니다."],
    },
    {
      label: "청중 질문",
      desc: "청중이 질문을 적어 보내는 폼. 누구나 열 수 있습니다",
      path: `/r/${roomId}/ask`,
      help: ["들어온 질문은 컨트롤러 메시지 패널에 쌓입니다.", "표시를 누르면 뷰어에 올라갑니다."],
    },
    {
      label: "오퍼레이터",
      desc: "시작, 일시정지, 이전, 다음, 시간 가감만 있는 화면",
      path: `/r/${roomId}/operator${k}`,
      secret: true,
      help: ["휴대폰을 한 손에 들고 쓰기 좋습니다.", "타이머 편집이나 메시지는 컨트롤러에서 합니다."],
    },
    {
      label: "모더레이터",
      desc: "메시지만 보내는 화면",
      path: `/r/${roomId}/moderator${k}`,
      secret: true,
      help: ["사회자나 무대 감독이 씁니다.", "타이머는 건드리지 않고 메시지만 띄우고 내립니다."],
    },
    {
      label: "컨트롤러",
      desc: "전체 제어. 운영자만 가지고 있어야 합니다",
      path: `/r/${roomId}${k}`,
      secret: true,
      help: ["이 주소를 아는 사람은 누구나 타이머를 조작할 수 있습니다.", "컨트롤러를 여러 개 열어도 한쪽 조작이 다른 쪽에 바로 반영됩니다."],
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title="출력 링크 공유" wide>
      <p className="mb-4 flex items-center text-xs text-muted">
        같은 Wi‑Fi에 있는 기기는 서버가 켜진 컴퓨터의 IP 주소로 들어오면 됩니다. QR을 찍는 게 제일 빠릅니다.
        <HelpDot
          content={
            <HelpList
              items={[
                <><code className="bg-white/15 text-white">localhost</code> 주소는 이 컴퓨터에서만 열립니다.</>,
                "비밀키가 붙은 링크는 운영자끼리만 주고받으세요.",
                "24시간 동안 아무도 쓰지 않은 방은 지워집니다.",
              ]}
            />
          }
        />
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <LinkCard key={l.path} link={l} url={`${origin}${l.path}`} />
        ))}
      </div>
    </Modal>
  );
}

function LinkCard({ link, url }: { link: LinkDef; url: string }) {
  const [qr, setQr] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { margin: 1, width: 160, color: { dark: "#191f28", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [url]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      prompt("링크를 복사하세요", url);
    }
  };

  return (
    <div className="flex gap-3 rounded-xl border border-line bg-panel-2 p-3">
      {qr ? <img src={qr} alt="" className="h-20 w-20 shrink-0 rounded-lg border border-line bg-white" /> : <div className="h-20 w-20 shrink-0" />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{link.label}</span>
          {link.help && <HelpDot content={<HelpList items={link.help} />} />}
          {link.secret && <span className="rounded-full bg-danger/10 px-1.5 py-0.5 text-[10px] font-medium text-danger-ink">비밀키 포함</span>}
        </div>
        <p className="text-xs text-muted">{link.desc}</p>
        <div className="mt-2 flex items-center gap-1">
          <input className="input font-mono text-[11px]" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
          <button className="btn btn-sm shrink-0" onClick={copy}>
            {copied ? "복사됨" : "복사"}
          </button>
          <a className="btn btn-sm shrink-0" href={url} target="_blank" rel="noreferrer">
            열기
          </a>
        </div>
      </div>
    </div>
  );
}
