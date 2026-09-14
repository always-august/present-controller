"use client";
import { useEffect, useState } from "react";
import type { Appearance, StartMode, Timer, TimerInput, TimerMode } from "../../shared/types";
import { msToClockInput, parseDuration } from "../lib/time";
import { useRoomStore } from "../store/room";
import { Modal } from "./Modal";
import { HelpDot } from "./Tooltip";

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
    if (durationMs == null) return setError("길이 형식이 잘못되었어요. 예: 10:00, 1:30:00, 90s");
    if (wrapUpMs == null) return setError("종료 안내 시점 형식이 잘못되었어요. 예: 1:00, 30s");
    const scheduledStart =
      form.startMode === "scheduled" && form.scheduledStart ? new Date(form.scheduledStart).getTime() : null;
    if (form.startMode === "scheduled" && !scheduledStart) return setError("예약 시작 시각을 입력해 주세요.");

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
            <label className="label">모드<HelpDot text="카운트다운은 남은 시간을, 카운트업은 지난 시간을 세어요. 현재 시각은 시계만 보여줘요" /></label>
            <select className="input" value={form.mode} onChange={(e) => set("mode", e.target.value as TimerMode)}>
              <option value="countdown">카운트다운</option>
              <option value="countup">카운트업</option>
              <option value="clock">현재 시각</option>
            </select>
          </div>
          <div>
            <label className="label">길이<HelpDot text="10:00, 1:30:00, 90s, 5m 어떤 식으로 적어도 돼요" /></label>
            <input className="input font-mono tnum" value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="10:00" disabled={form.mode === "clock"} />
          </div>
          <div>
            <label className="label">종료 안내 시점<HelpDot text="남은 시간이 이 값 아래로 내려가면 뷰어 숫자가 노란색으로 바뀌고 알림음과 배너가 나와요. 0으로 두면 꺼요" /></label>
            <input className="input font-mono tnum" value={form.wrapUp} onChange={(e) => set("wrapUp", e.target.value)} placeholder="1:00" />
            <p className="mt-1 text-[11px] text-muted">이만큼 남으면 노란색으로 바뀌고 알림이 울려요</p>
          </div>
          <div>
            <label className="label">뷰어 배경<HelpDot text="크로마키를 고르면 뷰어 배경이 초록색이 돼요. OBS에서 합성할 때 써요" /></label>
            <select className="input" value={form.appearance} onChange={(e) => set("appearance", e.target.value as Appearance)}>
              <option value="default">기본 (검정)</option>
              <option value="chroma">크로마키 (초록, OBS용)</option>
            </select>
          </div>
          <div>
            <label className="label">시작 방식<HelpDot text="예약을 고르면 정해 둔 시각에 서버가 알아서 시작해요. 뷰어만 열려 있어도 돼요" /></label>
            <select className="input" value={form.startMode} onChange={(e) => set("startMode", e.target.value as StartMode)}>
              <option value="manual">수동</option>
              <option value="scheduled">예약</option>
            </select>
          </div>
          <div>
            <label className="label">예약 시작 시각<HelpDot text="이 기기의 시간대 기준이에요" /></label>
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
            <HelpDot text="0이 되는 순간 목록의 다음 세션이 이어서 시작돼요. 초과 시간은 생기지 않아요" />
          </label>
          <div className="col-span-2">
            <label className="label">메모<HelpDot text="어드민에서만 보여요. 뷰어에는 나오지 않아요" /></label>
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
