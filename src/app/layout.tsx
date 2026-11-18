import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { ReadyFlag } from "@/components/ReadyFlag";
import "./globals.css";

export const metadata: Metadata = {
  title: "마부 — 발표 타이머",
  description: "마무리 부탁드립니다. 원격 제어형 발표 타이머",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${GeistMono.variable} h-full antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ReadyFlag />
        {/* 오래된 브라우저는 앱 스크립트를 못 돌려 "연결 중…"에 멈춘다. ES5로만 써서 그런 브라우저에서도 이 안내는 뜨게 한다 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `setTimeout(function(){if(window.__mabuReady)return;var d=document.createElement("div");d.setAttribute("style","position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;padding:16px;border-radius:12px;background:#191f28;color:#fff;font:14px/1.6 -apple-system,sans-serif");d.innerHTML="<b>이 브라우저에서는 마부가 동작하지 않아요</b><br>브라우저가 오래돼서 화면을 그리지 못하고 있어요. 기기와 브라우저를 최신 버전으로 업데이트하거나 다른 기기에서 열어 주세요.<br><span style=\"opacity:.7;font-size:12px\">iPad는 iPadOS 16.4 이상, Android는 최신 Chrome에서 동작해요.</span>";document.body.appendChild(d)},10000);`,
          }}
        />
      </body>
    </html>
  );
}
