const CONTACT = "minsukiya@gmail.com";

export function Footer({ className = "" }: { className?: string }) {
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
    </footer>
  );
}
