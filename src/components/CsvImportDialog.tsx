"use client";
import { useState } from "react";
import type { TimerInput } from "../../shared/types";
import { parseTimerCsv } from "../lib/csv";
import { msToClockInput } from "../lib/time";
import { useRoomStore } from "../store/room";
import { Modal } from "./Modal";

const SAMPLE = `title,speaker,duration,notes
오프닝,사회자,5:00,
키노트,김민수,30:00,Q&A 포함
휴식,,10:00,
세션 1,이영희,20:00,`;

export function CsvImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const send = useRoomStore((s) => s.send);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<{ timers: TimerInput[]; errors: string[] } | null>(null);

  const parse = (t: string) => {
    setText(t);
    setPreview(t.trim() ? parseTimerCsv(t) : null);
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    file.text().then(parse);
  };

  const submit = () => {
    if (!preview?.timers.length) return;
    send({ type: "timer:import", payload: preview.timers });
    setText("");
    setPreview(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="CSV 임포트" wide>
      <p className="mb-2 text-xs text-muted">
        컬럼 순서: <code className="rounded bg-panel-2 px-1">title, speaker, duration, notes</code>. 길이는 <code>10:00</code>, <code>1:30:00</code>, <code>90s</code>, <code>10</code>(분) 형식.
      </p>
      <div className="mb-3 flex gap-2">
        <input type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} className="text-xs" />
        <button className="btn btn-sm ml-auto" onClick={() => parse(SAMPLE)}>
          예시 불러오기
        </button>
      </div>
      <textarea className="input min-h-40 font-mono text-xs" value={text} onChange={(e) => parse(e.target.value)} placeholder={SAMPLE} />
      {preview && (
        <div className="mt-3">
          {preview.errors.length > 0 && (
            <ul className="mb-2 text-xs text-danger">
              {preview.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          <div className="max-h-48 overflow-auto rounded-lg border border-line">
            <table className="w-full text-xs">
              <thead className="bg-panel-2 text-muted">
                <tr>
                  <th className="px-2 py-1 text-left">제목</th>
                  <th className="px-2 py-1 text-left">발표자</th>
                  <th className="px-2 py-1 text-left">길이</th>
                  <th className="px-2 py-1 text-left">메모</th>
                </tr>
              </thead>
              <tbody>
                {preview.timers.map((t, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="px-2 py-1">{t.title}</td>
                    <td className="px-2 py-1">{t.speaker}</td>
                    <td className="px-2 py-1 font-mono tnum">{msToClockInput(t.durationMs ?? 0)}</td>
                    <td className="px-2 py-1 text-muted">{t.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn" onClick={onClose}>
          취소
        </button>
        <button className="btn btn-primary" onClick={submit} disabled={!preview?.timers.length}>
          {preview?.timers.length ?? 0}개 추가
        </button>
      </div>
    </Modal>
  );
}
