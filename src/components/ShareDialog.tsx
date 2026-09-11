"use client";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Modal } from "./Modal";

interface LinkDef {
  label: string;
  desc: string;
  path: string;
  secret?: boolean;
}

export function ShareDialog({ open, onClose, roomId, controllerKey }: { open: boolean; onClose: () => void; roomId: string; controllerKey: string }) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const k = `?key=${controllerKey}`;
  const links: LinkDef[] = [
    { label: "뷰어", desc: "발표자용 풀스크린 타이머 (공개)", path: `/r/${roomId}/viewer` },
    { label: "아젠다", desc: "전체 러닝오더와 진행 상황 (공개)", path: `/r/${roomId}/agenda` },
    { label: "청중 질문", desc: "질문 제출 폼 (공개)", path: `/r/${roomId}/ask` },
    { label: "오퍼레이터", desc: "시작/일시정지/다음만 있는 단순 제어", path: `/r/${roomId}/operator${k}`, secret: true },
    { label: "모더레이터", desc: "메시지 전용 제어", path: `/r/${roomId}/moderator${k}`, secret: true },
    { label: "컨트롤러", desc: "전체 제어. 이 링크는 운영자만 보관", path: `/r/${roomId}${k}`, secret: true },
  ];

  return (
    <Modal open={open} onClose={onClose} title="출력 링크 공유" wide>
      <p className="mb-4 text-xs text-muted">
        같은 네트워크의 다른 기기에서 접속하려면 <code className="rounded bg-panel-2 px-1">localhost</code> 대신 이 컴퓨터의 IP 주소로 열어야 합니다.
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
    QRCode.toDataURL(url, { margin: 1, width: 160, color: { dark: "#ffffff", light: "#00000000" } })
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
    <div className="flex gap-3 rounded-lg border border-line bg-panel-2 p-3">
      {qr ? <img src={qr} alt="" className="h-20 w-20 shrink-0 rounded bg-black/40" /> : <div className="h-20 w-20 shrink-0" />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{link.label}</span>
          {link.secret && <span className="rounded bg-danger/20 px-1 text-[10px] text-danger">비밀키 포함</span>}
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
