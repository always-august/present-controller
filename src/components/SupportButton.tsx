"use client";
import { useState } from "react";
import { SUPPORT_URL } from "../lib/support";
import { SupportDialog } from "./SupportDialog";

/** 첫 화면용 후원 버튼. 링크가 설정돼 있을 때만 보인다 */
export function SupportButton() {
  const [open, setOpen] = useState(false);
  if (!SUPPORT_URL) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="chip">
        ☕ 커피 한 잔 후원하기
      </button>
      <SupportDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
