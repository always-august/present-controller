"use client";
import { useEffect } from "react";

/** 앱 스크립트가 실제로 실행됐다는 표시. layout의 감시 스크립트가 이걸 보고 오래된 브라우저를 가려낸다 */
export function ReadyFlag() {
  useEffect(() => {
    (window as unknown as { __mabuReady?: boolean }).__mabuReady = true;
  }, []);
  return null;
}
