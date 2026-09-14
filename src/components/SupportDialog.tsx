"use client";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { SUPPORT_URL } from "../lib/support";
import { Modal } from "./Modal";

/** 후원 QR. 휴대폰으로 찍거나 링크를 눌러 송금 페이지로 간다 */
export function SupportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !SUPPORT_URL) return;
    QRCode.toDataURL(SUPPORT_URL, { margin: 1, width: 240, color: { dark: "#191f28", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="☕ 커피 한 잔 후원하기">
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm leading-relaxed text-subtext">
          마부는 무료로 운영돼요.
          <br />
          서버 비용에 보태 주시면 더 오래 켜 둘 수 있어요.
        </p>
        {qr ? (
          <img src={qr} alt="후원 QR 코드" className="h-56 w-56 rounded-xl border border-line bg-white p-2" />
        ) : (
          <div className="h-56 w-56 rounded-xl border border-line bg-panel-2" />
        )}
        <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full py-3">
          후원 페이지 열기
        </a>
        <p className="text-[11px] text-muted">휴대폰 카메라로 QR을 찍어도 같은 곳으로 가요.</p>
      </div>
    </Modal>
  );
}
