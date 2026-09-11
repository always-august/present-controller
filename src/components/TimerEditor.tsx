"use client";
import { useEffect, useState } from "react";
import type { Appearance, StartMode, Timer, TimerInput, TimerMode } from "../../shared/types";
import { msToClockInput, parseDuration } from "../lib/time";
import { useRoomStore } from "../store/room";
import { Modal } from "./Modal";

interface FormState {
  title: string;
  speaker: string;
  notes: string;
  mode: TimerMode;
  duration: string;
  wrapUp: string;
  chainNext: boolean;
  startMode: StartMode;
  scheduledStart: string; // datetime-local
  appearance: Appearance;
}

function toLocalInput(ts: number | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromTimer(t: Timer | null): FormState {
  return {
    title: t?.title ?? "",
    speaker: t?.speaker ?? "",
    notes: t?.notes ?? "",
    mode: t?.mode ?? "countdown",
    duration: msToClockInput(t?.durationMs ?? 10 * 60_000),
    wrapUp: msToClockInput(t?.wrapUpMs ?? 60_000),
    chainNext: t?.chainNext ?? false,
    startMode: t?.startMode ?? "manual",
    scheduledStart: toLocalInput(t?.scheduledStart ?? null),
    appearance: t?.appearance ?? "default",
  };
}

/** 타이머 생성/편집 모달. timer가 null이면 생성 */
export function TimerEditor({ open, timer, onClose }: { open: boolean; timer: Timer | null; onClose: () => void }) {
  const send = useRoomStore((s) => s.send);
  const [form, setForm] = useState<FormState>(() => fromTimer(timer));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(fromTimer(timer));
      setError(null);
    }
  }, [open, timer]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const durationMs = parseDuration(form.duration);
    const wrapUpMs = form.wrapUp.trim() ? parseDuration(form.wrapUp) : 0;
    if (durationMs == null) return setError("길이 형식이 잘못되었습니다. 예: 10:00, 1:30:00, 90s");
    if (wrapUpMs == null) return setError("종료 안내 시점 형식이 잘못되었습니다. 예: 1:00, 30s");
    const scheduledStart =
      form.startMode === "scheduled" && form.scheduledStart ? new Date(form.scheduledStart).getTime() : null;
    if (form.startMode === "scheduled" && !scheduledStart) return setError("예약 시작 시각을 입력하세요.");

    const input: TimerInput = {
      title: form.title.trim(),
      speaker: form.speaker.trim(),
      notes: form.notes,
      mode: form.mode,
      durationMs,
      wrapUpMs,
      chainNext: form.chainNext,
      startMode: form.startMode,
      scheduledStart,
      appearance: form.appearance,
    };
    if (timer) send({ type: "timer:update", payload: { id: timer.id, ...input } });
    else send({ type: "timer:create", payload: input });
    onClose();
  };

  const remove = () => {
    if (!timer) return;
    if (!confirm(`"${timer.title || "제목 없음"}" 타이머를 삭제할까요?`)) return;
    send({ type: "timer:delete", payload: { id: timer.id } });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={timer ? "타이머 편집" : "타이머 추가"}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">제목</label>
            <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="세션 제목" autoFocus />
          </div>
          <div className="col-span-2">
            <label className="label">발표자</label>
            <input className="input" value={form.speaker} onChange={(e) => set("speaker", e.target.value)} placeholder="이름" />
          </div>
          <div>
            <label className="label">모드</label>
            <select className="input" value={form.mode} onChange={(e) => set("mode", e.target.value as TimerMode)}>
              <option value="countdown">카운트다운</option>
              <option value="countup">카운트업</option>
              <option value="clock">현재 시각</option>
            </select>
          </div>
          <div>
            <label className="label">길이 (MM:SS 또는 H:MM:SS)</label>
            <input className="input font-mono tnum" value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="10:00" disabled={form.mode === "clock"} />
          </div>
          <div>
            <label className="label">종료 안내 시점 (남은 시간)</label>
            <input className="input font-mono tnum" value={form.wrapUp} onChange={(e) => set("wrapUp", e.target.value)} placeholder="1:00" />
            <p className="mt-1 text-[11px] text-muted">이 시간 이하로 남으면 노란색 전환 + 알림</p>
          </div>
          <div>
            <label className="label">뷰어 배경</label>
            <select className="input" value={form.appearance} onChange={(e) => set("appearance", e.target.value as Appearance)}>
              <option value="default">기본 (검정)</option>
              <option value="chroma">크로마키 (초록, OBS용)</option>
            </select>
          </div>
          <div>
            <label className="label">시작 방식</label>
            <select className="input" value={form.startMode} onChange={(e) => set("startMode", e.target.value as StartMode)}>
              <option value="manual">수동</option>
              <option value="scheduled">예약</option>
            </select>
          </div>
          <div>
            <label className="label">예약 시작 시각</label>
            <input
              type="datetime-local"
              className="input"
              value={form.scheduledStart}
              onChange={(e) => set("scheduledStart", e.target.value)}
              disabled={form.startMode !== "scheduled"}
            />
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.chainNext} onChange={(e) => set("chainNext", e.target.checked)} />
            종료 시 다음 타이머 자동 시작
          </label>
          <div className="col-span-2">
            <label className="label">메모 (운영자만 보임)</label>
            <textarea className="input min-h-20" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex items-center justify-between pt-2">
          {timer ? (
            <button type="button" className="btn btn-danger btn-sm" onClick={remove}>
              삭제
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className="btn" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary">
              {timer ? "저장" : "추가"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
