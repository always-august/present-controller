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
      desc: "발표자가 보는 풀스크린 타이머. 누구나 열 수 있어요",
      path: `/r/${roomId}/viewer`,
      help: [
        "무대 모니터나 태블릿에 띄워 주세요.",
        "화면을 한 번 탭해야 알림음이 켜져요.",
        "풀스크린을 켜고 3초 두면 커서와 버튼이 사라져요.",
        "화면 꺼짐 방지는 자동으로 켜져요. 네트워크가 끊겨도 계속 가요.",
        <>주소 뒤에 <code className="bg-white/15 text-white">?chroma=green</code>을 붙이면 OBS용 초록 배경, <code className="bg-white/15 text-white">?hideTitle=1</code>처럼 요소를 숨길 수 있어요.</>,
      ],
    },
    {
      label: "청중 질문",
      desc: "청중이 질문을 적어 보내는 폼. 누구나 열 수 있어요",
      path: `/r/${roomId}/ask`,
      help: ["들어온 질문은 어드민 메시지 패널에 쌓여요.", "표시를 누르면 뷰어에 올라가요."],
    },
    {
      label: "어드민",
      desc: "지금 이 화면. 전체 제어. 운영자만 가지고 있어야 해요",
      path: `/r/${roomId}${k}`,
      secret: true,
      help: ["이 주소를 아는 사람은 누구나 타이머를 조작할 수 있어요.", "어드민을 여러 개 열어도 한쪽 조작이 다른 쪽에 바로 반영돼요."],
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title="출력 링크 공유" wide>
      <p className="mb-4 flex items-center text-xs text-muted">
        링크를 복사해 보내거나, 다른 기기에서 QR을 찍으면 바로 열려요.
        <HelpDot
          content={
            <HelpList
              items={[
                "비밀키가 붙은 링크는 운영자끼리만 주고받으세요.",
                "24시간 동안 아무도 쓰지 않은 방은 지워져요.",
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
      prompt("링크를 복사해 주세요", url);
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
