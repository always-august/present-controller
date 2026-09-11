"use client";
import { useEffect } from "react";

/**
 * Screen Wake Lock API로 화면 꺼짐을 막고, 미지원 브라우저에서는 nosleep.js(무음 비디오 루프)로 폴백.
 * 비디오 폴백은 사용자 제스처가 필요하므로 첫 터치/클릭에 활성화한다.
 */
export function useWakeLock() {
  useEffect(() => {
    let sentinel: WakeLockSentinel | null = null;
    let noSleep: { enable: () => Promise<void>; disable: () => void } | null = null;
    let disposed = false;

    const request = async () => {
      if (disposed || document.visibilityState !== "visible") return;
      if ("wakeLock" in navigator) {
        try {
          sentinel = await navigator.wakeLock.request("screen");
          sentinel.addEventListener("release", () => (sentinel = null));
          return;
        } catch {
          /* 배터리 절약 모드 등으로 거절될 수 있음 → 폴백 */
        }
      }
      if (!noSleep) {
        const mod = await import("nosleep.js");
        noSleep = new mod.default();
      }
      try {
        await noSleep.enable();
      } catch {
        /* 제스처 밖에서 호출되면 실패. 다음 제스처에서 재시도 */
      }
    };

    const onGesture = () => void request();
    const onVisible = () => {
      if (document.visibilityState === "visible" && !sentinel) void request();
    };

    void request();
    document.addEventListener("click", onGesture, { passive: true });
    document.addEventListener("touchstart", onGesture, { passive: true });
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      disposed = true;
      document.removeEventListener("click", onGesture);
      document.removeEventListener("touchstart", onGesture);
      document.removeEventListener("visibilitychange", onVisible);
      sentinel?.release().catch(() => {});
      noSleep?.disable();
    };
  }, []);
}
