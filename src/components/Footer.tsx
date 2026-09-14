"use client";
import { useState } from "react";
import { SUPPORT_URL } from "../lib/support";
import { SupportDialog } from "./SupportDialog";

const CONTACT = "minsukiya@gmail.com";

export function Footer({ className = "" }: { className?: string }) {
  const [supportOpen, setSupportOpen] = useState(false);
  return (
    <footer className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-6 text-center text-xs text-muted ${className}`}>
      <span>© {new Date().getFullYear()} 마부. All rights reserved.</span>
      <span className="hidden sm:inline">·</span>
      <span>
        문의{" "}
        <a href={`mailto:${CONTACT}`} className="text-subtext underline decoration-line underline-offset-2 hover:text-ink">
          {CONTACT}
        </a>
      </span>
      {SUPPORT_URL && (
        <>
          <span className="hidden sm:inline">·</span>
          <button type="button" onClick={() => setSupportOpen(true)} className="text-subtext underline decoration-line underline-offset-2 hover:text-ink">
            ☕ 후원하기
          </button>
          <SupportDialog open={supportOpen} onClose={() => setSupportOpen(false)} />
        </>
      )}
    </footer>
  );
}
