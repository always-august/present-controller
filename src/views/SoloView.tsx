"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlaybackState } from "../../shared/types";
import { BigTime } from "../components/BigTime";
import { Footer } from "../components/Footer";
import { isAudioUnlocked, unlockAudio, useChime } from "../hooks/useChime";
import { useCountdown, type Phase } from "../hooks/useCountdown";
import { useWakeLock } from "../hooks/useWakeLock";
import { IDLE_PLAYBACK, loadSoloSettings, saveSoloSettings, soloAdjust, soloPause, soloReset, soloStart, toTimer, type SoloSettings } from "../lib/solo";
import { formatMs, humanDuration, msToClockInput, parseDuration } from "../lib/time";

const PRESETS = [5, 10, 15, 20, 30, 45];
const UI_HIDE_MS = 3000;

export function SoloView() {
  const [settings, setSettings] = useState<SoloSettings | null>(null);
  const [running, setRunning] = useState(false);
  useEffect(() => setSettings(loadSoloSettings()), []);

  if (!settings) return null;
  if (running) return <SoloTimer settings={settings} onExit={() => setRunning(false)} />;
  return (
    <SoloSetup
      settings={settings}
      onStart={(s) => {
        saveSoloSettings(s);
        setSettings(s);
        setRunning(true);
      }}
    />
  );
}

/* ───────────────────────── 설정 화면 ───────────────────────── */

function SoloSetup({ settings, onStart }: { settings: SoloSettings; onStart: (s: SoloSettings) => void }) {
  const [title, setTitle] = useState(settings.title);
  const [duration, setDuration] = useState(msToClockInput(settings.durationMs));
  const [wrapUp, setWrapUp] = useState(msToClockInput(settings.wrapUpMs));
  const [chime, setChime] = useState(settings.chime);
  const [countup, setCountup] = useState(settings.countup);
  const [error, setError] = useState<string | null>(null);

  const durationMs = parseDuration(duration);
  const activePreset = PRESETS.find((m) => m * 60_000 === durationMs);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = parseDuration(duration);
    const w = wrapUp.trim() ? parseDuration(wrapUp) : 0;
    if (d == null || d <= 0) return setError("시간 형식이 잘못되었어요. 예: 15:00, 1:30:00, 90s");
    if (w == null) return setError("종료 안내 시점 형식이 잘못되었어요. 예: 1:00, 30s");
    unlockAudio(); // 시작 버튼 클릭이 사용자 제스처라 여기서 오디오를 열어 둔다
    onStart({ title: title.trim(), durationMs: d, wrapUpMs: w, chime, countup });
  };

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">혼자 발표하기</h1>
            <p className="mt-2 text-sm text-muted">방 없이 이 기기에서 바로 타이머를 돌려요.</p>
          </div>
          <form className="card space-y-5 p-6" onSubmit={submit}>
            <div>
              <label className="label" htmlFor="solo-title">
                제목 (선택)
              </label>
              <input id="solo-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 팀 주간 공유" maxLength={80} />
            </div>

            <div>
              <label className="label">발표 시간</label>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`chip tnum ${activePreset === m ? "is-active" : ""}`}
                    onClick={() => {
                      setDuration(msToClockInput(m * 60_000));
                      setError(null);
                    }}
                  >
                    {m}분
                  </button>
                ))}
              </div>
              <input
                className="input font-mono tnum"
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  setError(null);
                }}
                placeholder="15:00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">종료 안내 시점</label>
                <input
                  className="input font-mono tnum"
                  value={wrapUp}
                  onChange={(e) => {
                    setWrapUp(e.target.value);
                    setError(null);
                  }}
                  placeholder="1:00"
                />
                <p className="mt-1 text-[11px] text-muted">이만큼 남으면 노란색으로 바뀌어요</p>
              </div>
              <div className="space-y-2 pt-6 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={chime} onChange={(e) => setChime(e.target.checked)} /> 알림음
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={countup} onChange={(e) => setCountup(e.target.checked)} /> 지난 시간으로 세기
                </label>
              </div>
            </div>

            {error && <p className="text-sm text-danger-ink">{error}</p>}
            <button className="btn btn-primary w-full py-3 text-base" type="submit">
              ▶ 타이머 열기
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-muted">
            설정은 이 브라우저에 저장돼요. 다른 기기에서 조작하려면{" "}
            <Link href="/" className="text-subtext underline decoration-line underline-offset-2 hover:text-ink">
              방을 만드세요
            </Link>
            .
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}

/* ───────────────────────── 타이머 화면 ───────────────────────── */

function SoloTimer({ settings, onExit }: { settings: SoloSettings; onExit: () => void }) {
  useWakeLock();
  const timer = useMemo(() => toTimer(settings), [settings]);
  const [playback, setPlayback] = useState<PlaybackState>(IDLE_PLAYBACK);
  const { remainingMs, phase, progress } = useCountdown(playback, timer);
  useChime(phase, settings.chime);

  const start = useCallback(() => setPlayback((p) => soloStart(p, timer, Date.now())), [timer]);
  const pause = useCallback(() => setPlayback((p) => soloPause(p, Date.now())), []);
  const reset = useCallback(() => setPlayback(soloReset()), []);
  const adjust = useCallback((ms: number) => setPlayback((p) => soloAdjust(p, ms)), []);
  const isRunning = playback.status === "running";

  const timeText = useMemo(() => {
    if (timer.mode === "countup") return formatMs(Math.max(0, timer.durationMs + playback.adjustmentMs - remainingMs));
    return formatMs(remainingMs);
  }, [timer, playback.adjustmentMs, remainingMs]);

  // ---- 종료 안내 배너 ----
  const [alert, setAlert] = useState<{ key: number; text: string; phase: Phase } | null>(null);
  const prevPhase = useRef<Phase>(phase);
  useEffect(() => {
    const was = prevPhase.current;
    prevPhase.current = phase;
    if (was === phase) return;
    if (phase === "wrapup" && was === "normal") setAlert({ key: Date.now(), text: `${humanDuration(timer.wrapUpMs)} 남았습니다`, phase });
    else if (phase === "over" && (was === "normal" || was === "wrapup")) setAlert({ key: Date.now(), text: "시간이 종료되었습니다", phase });
  }, [phase, timer.wrapUpMs]);
  useEffect(() => {
    if (!alert) return;
    const id = setTimeout(() => setAlert(null), 5000);
    return () => clearTimeout(id);
  }, [alert]);

  // ---- 3초 무조작 시 UI 숨김 (진행 중일 때만. 멈춰 있을 땐 항상 보인다) ----
  const [uiVisible, setUiVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(isRunning);
  runningRef.current = isRunning;
  const poke = useCallback(() => {
    setUiVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (runningRef.current) hideTimer.current = setTimeout(() => setUiVisible(false), UI_HIDE_MS);
  }, []);
  useEffect(() => {
    poke();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [isRunning, poke]);

  // ---- 단축키 ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.code === "Space" ? " " : e.key) {
        case " ":
          e.preventDefault();
          if (isRunning) pause();
          else start();
          break;
        case "r":
        case "R":
          reset();
          break;
        case "ArrowUp":
          adjust(60_000);
          break;
        case "ArrowDown":
          adjust(-60_000);
          break;
        case "Escape":
          if (document.fullscreenElement) void document.exitFullscreen();
          else onExit();
          break;
        default:
          return;
      }
      poke();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRunning, start, pause, reset, adjust, poke, onExit]);

  // ---- 풀스크린 / 오디오 ----
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  useEffect(() => {
    setAudioOn(isAudioUnlocked());
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    const onGesture = () => {
      unlockAudio();
      setTimeout(() => setAudioOn(isAudioUnlocked()), 50);
    };
    document.addEventListener("pointerdown", onGesture, { passive: true });
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("pointerdown", onGesture);
    };
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => {});
  };

  const btn = "rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25 active:scale-[0.98] disabled:opacity-40";

  return (
    <div
      className={`fixed inset-0 flex select-none flex-col overflow-hidden bg-black text-white ${uiVisible ? "" : "no-cursor"}`}
      onMouseMove={poke}
      onPointerDown={poke}
      tabIndex={-1}
    >
      {/* 상단: 제목 */}
      {settings.title && (
        <div className="px-[3vw] pt-[2vh] font-semibold leading-tight text-white/80" style={{ fontSize: "min(3.5vw, 5vh)" }}>
          <div className="truncate">{settings.title}</div>
        </div>
      )}

      {/* 중앙: 숫자 */}
      <div className="min-h-0 flex-1 px-[3vw] pb-[10vh]">
        <BigTime text={timeText} phase={phase} />
      </div>

      {/* 진행 바 */}
      {timer.mode === "countdown" && playback.status !== "idle" && (
        <div className="absolute inset-x-0 bottom-0 h-[1.2vh] bg-white/10">
          <div
            className="h-full transition-[width] duration-200"
            style={{ width: `${progress * 100}%`, background: phase === "over" ? "#ff4d4f" : phase === "wrapup" ? "#f5c542" : "#ffffff" }}
          />
        </div>
      )}

      {/* 종료 안내 */}
      {alert && (
        <div key={alert.key} className="pointer-events-none absolute inset-x-0 top-[14vh] flex justify-center animate-fade-out">
          <div className="rounded-2xl px-[3vw] py-[1.5vh] font-bold text-black shadow-2xl" style={{ fontSize: "min(4vw, 6vh)", background: alert.phase === "over" ? "#ff4d4f" : "#f5c542" }}>
            {alert.text}
          </div>
        </div>
      )}

      {/* 조작 줄 */}
      <div className={`absolute inset-x-0 bottom-[4vh] flex justify-center px-4 transition-opacity ${uiVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-white/10 p-2 backdrop-blur-md">
          <button className={btn} onClick={onExit} title="설정으로 돌아가요 (Esc)">
            ← 설정
          </button>
          <button className={btn} onClick={reset} title="처음 길이로 되돌려요 (R)">
            ↺ 리셋
          </button>
          <button className={btn} onClick={() => adjust(-60_000)} title="1분 줄여요 (↓)">
            −1분
          </button>
          <button
            className={`${btn} min-w-32 ${isRunning ? "bg-danger/80 hover:bg-danger" : "bg-accent hover:bg-accent-dark"}`}
            onClick={isRunning ? pause : start}
            aria-label={isRunning ? "일시정지 (Space)" : "시작 (Space)"}
          >
            {isRunning ? "❚❚ 일시정지" : playback.status === "paused" ? "▶ 재개" : "▶ 시작"}
          </button>
          <button className={btn} onClick={() => adjust(60_000)} title="1분 늘려요 (↑)">
            +1분
          </button>
          {settings.chime && !audioOn && (
            <button className={btn} onClick={unlockAudio} title="브라우저 정책상 한 번 탭해야 알림음이 재생돼요">
              🔔 알림음
            </button>
          )}
          <button className={btn} onClick={toggleFullscreen}>
            {isFullscreen ? "풀스크린 해제" : "⛶ 풀스크린"}
          </button>
        </div>
      </div>
    </div>
  );
}
