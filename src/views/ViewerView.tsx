"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Message, MessageColor } from "../../shared/types";
import { BigTime } from "../components/BigTime";
import { ConnectionBadge } from "../components/ConnectionBadge";
import { RoomGate } from "../components/RoomGate";
import { isAudioUnlocked, unlockAudio, useChime } from "../hooks/useChime";
import { useCountdown, type Phase } from "../hooks/useCountdown";
import { useRoomConnection } from "../hooks/useRoomConnection";
import { useWakeLock } from "../hooks/useWakeLock";
import { formatClock, formatMs, humanDuration } from "../lib/time";
import { selectActiveTimer, useRoomStore } from "../store/room";

export interface ViewerOptions {
  chroma: string;
  hideTitle: boolean;
  hideSpeaker: boolean;
  hideClock: boolean;
  hideProgress: boolean;
  hideMessages: boolean;
}

const CHROMA: Record<string, string> = { green: "#00ff00", blue: "#0000ff", magenta: "#ff00ff" };
const MSG_COLOR: Record<MessageColor, string> = { white: "#ffffff", yellow: "#f5c542", red: "#ff4d4f", green: "#3ddc84" };
const UI_HIDE_MS = 3000;

export function ViewerView({ roomId, options }: { roomId: string; options: ViewerOptions }) {
  useRoomConnection(roomId);
  useWakeLock();

  const room = useRoomStore((s) => s.room);
  const timer = useRoomStore(selectActiveTimer);
  const now = useRoomStore((s) => s.now);
  const playback = room?.playback;
  const settings = room?.settings;
  const { remainingMs, phase, progress } = useCountdown(playback, timer);
  useChime(phase, Boolean(settings?.chimeEnabled));

  // ---- 표시 문자열 ----
  const [clock, setClock] = useState("");
  useEffect(() => {
    if (!settings) return;
    const tick = () => setClock(formatClock(now(), settings.timeFormat, settings.timezone));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [settings, now]);

  const timeText = useMemo(() => {
    if (!timer) return "--:--";
    if (timer.mode === "clock") return clock || "--:--";
    if (timer.mode === "countup") {
      const total = timer.durationMs + (playback?.adjustmentMs ?? 0);
      return formatMs(Math.max(0, total - remainingMs));
    }
    return formatMs(remainingMs);
  }, [timer, clock, playback, remainingMs]);

  // ---- 종료 안내 알림 배너 (wrap-up 진입, 0 도달 시 5초 표시) ----
  const [alert, setAlert] = useState<{ key: number; text: string; phase: Phase } | null>(null);
  const prevPhase = useRef<Phase>(phase);
  useEffect(() => {
    const was = prevPhase.current;
    prevPhase.current = phase;
    if (was === phase) return;
    if (phase === "wrapup" && was === "normal" && timer) {
      setAlert({ key: Date.now(), text: `${humanDuration(timer.wrapUpMs)} 남았습니다`, phase });
    } else if (phase === "over" && (was === "normal" || was === "wrapup")) {
      setAlert({ key: Date.now(), text: "시간이 종료되었습니다", phase });
    }
  }, [phase, timer]);
  useEffect(() => {
    if (!alert) return;
    const id = setTimeout(() => setAlert(null), 5000);
    return () => clearTimeout(id);
  }, [alert]);

  // ---- 3초 무조작 시 커서/UI 숨김 ----
  const [uiVisible, setUiVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const poke = useCallback(() => {
    setUiVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setUiVisible(false), UI_HIDE_MS);
  }, []);
  useEffect(() => {
    poke();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [poke]);

  // ---- 풀스크린 / 오디오 잠금 해제 ----
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    const onGesture = () => {
      unlockAudio();
      setTimeout(() => setAudioOn(isAudioUnlocked()), 50);
    };
    document.addEventListener("pointerdown", onGesture, { passive: true });
    document.addEventListener("keydown", onGesture);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("pointerdown", onGesture);
      document.removeEventListener("keydown", onGesture);
    };
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => {});
  };

  // ---- 배경 ----
  const chromaParam = options.chroma || (timer?.appearance === "chroma" ? "green" : "");
  const background = chromaParam ? (CHROMA[chromaParam] ?? (/^[0-9a-f]{6}$/i.test(chromaParam) ? `#${chromaParam}` : CHROMA.green)) : "#000000";

  const showTitle = settings?.showTitle && !options.hideTitle && timer?.title;
  const showSpeaker = settings?.showSpeaker && !options.hideSpeaker && timer?.speaker;
  const showClock = settings?.showTimeOfDay && !options.hideClock && timer?.mode !== "clock";
  const showProgress = settings?.showProgressBar && !options.hideProgress && timer && timer.mode === "countdown" && playback?.status !== "idle";
  const visibleMessages = useMemo(
    () => (options.hideMessages ? [] : (room?.messages ?? []).filter((m) => m.visible).sort((a, b) => b.createdAt - a.createdAt).slice(0, 2)),
    [room?.messages, options.hideMessages],
  );
  const hasMessages = visibleMessages.length > 0;

  return (
    <RoomGate>
      <div
        className={`fixed inset-0 flex select-none flex-col overflow-hidden ${uiVisible ? "" : "no-cursor"}`}
        style={{ background }}
        onMouseMove={poke}
        onPointerDown={poke}
        onKeyDown={poke}
        tabIndex={-1}
      >
        <ConnectionBadge minimal />

        {/* 상단: 제목/발표자, 현재 시각 */}
        <div className="flex items-start justify-between px-[3vw] pt-[2vh] text-white/80" style={{ fontSize: "min(3.5vw, 5vh)" }}>
          <div className="min-w-0 pr-4 leading-tight">
            {showTitle && <div className="truncate font-semibold">{timer.title}</div>}
            {showSpeaker && <div className="truncate text-white/60" style={{ fontSize: "0.7em" }}>{timer.speaker}</div>}
          </div>
          {showClock && <div className="shrink-0 font-mono tnum text-white/60">{clock}</div>}
        </div>

        {/* 중앙: 숫자 */}
        <div className={`min-h-0 flex-1 px-[3vw] text-white ${hasMessages ? "pb-[2vh]" : "pb-[6vh]"}`}>
          <BigTime text={timeText} phase={timer?.mode === "clock" ? "normal" : phase} />
        </div>

        {/* 하단: 메시지 */}
        {hasMessages && (
          <div className="flex flex-col items-center gap-[1vh] px-[4vw] pb-[6vh]">
            {visibleMessages.map((m) => (
              <MessageLine key={m.id} m={m} />
            ))}
          </div>
        )}

        {/* 진행 바 */}
        {showProgress && (
          <div className="absolute inset-x-0 bottom-0 h-[1.2vh] bg-white/10">
            <div
              className="h-full transition-[width] duration-200"
              style={{ width: `${progress * 100}%`, background: phase === "over" ? "#ff4d4f" : phase === "wrapup" ? "#f5c542" : "#ffffff" }}
            />
          </div>
        )}

        {/* 종료 안내 알림 */}
        {alert && (
          <div key={alert.key} className="pointer-events-none absolute inset-x-0 top-[14vh] flex justify-center animate-fade-out">
            <div
              className="rounded-2xl px-[3vw] py-[1.5vh] font-bold text-black shadow-2xl"
              style={{ fontSize: "min(4vw, 6vh)", background: alert.phase === "over" ? "#ff4d4f" : "#f5c542" }}
            >
              {alert.text}
            </div>
          </div>
        )}

        {/* 조작 버튼 (3초 후 숨김) */}
        <div className={`absolute bottom-[3vh] right-[2vw] flex gap-2 transition-opacity ${uiVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          {settings?.chimeEnabled && !audioOn && (
            <button className="rounded-lg bg-white/15 px-3 py-2 text-sm text-white backdrop-blur hover:bg-white/25" onClick={unlockAudio} title="브라우저 정책상 한 번 탭해야 알림음이 재생됩니다">
              🔔 알림음 켜기
            </button>
          )}
          <button className="rounded-lg bg-white/15 px-3 py-2 text-sm text-white backdrop-blur hover:bg-white/25" onClick={toggleFullscreen}>
            {isFullscreen ? "풀스크린 해제" : "⛶ 풀스크린"}
          </button>
        </div>
      </div>
    </RoomGate>
  );
}

/** 텍스트 길이에 따라 폰트를 자동 축소하는 메시지 한 줄 */
function MessageLine({ m }: { m: Message }) {
  const len = m.text.length;
  // 20자까지는 큰 글씨, 이후 길이에 반비례해 줄이되 하한을 둔다
  const scale = len <= 20 ? 1 : Math.max(0.45, 20 / len);
  return (
    <div
      className={`max-w-full text-center leading-tight ${m.bold ? "font-bold" : "font-medium"} ${m.flash ? "animate-flash" : ""}`}
      style={{ fontSize: `calc(min(7vw, 10vh) * ${scale})`, color: MSG_COLOR[m.color], wordBreak: "keep-all", overflowWrap: "anywhere" }}
    >
      {m.text}
    </div>
  );
}
