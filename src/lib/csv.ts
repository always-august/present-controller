import type { TimerInput } from "../../shared/types";
import { parseDuration } from "./time";

/** 큰따옴표와 쉼표를 처리하는 최소 CSV 파서 */
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** 컬럼 순서: title, speaker, duration, notes. 헤더 행은 자동 감지 */
export function parseTimerCsv(text: string): { timers: TimerInput[]; errors: string[] } {
  const rows = parseCsvRows(text.replace(/^﻿/, ""));
  const errors: string[] = [];
  const timers: TimerInput[] = [];
  const start = rows[0]?.[0]?.trim().toLowerCase() === "title" ? 1 : 0;
  for (let i = start; i < rows.length; i++) {
    const [title = "", speaker = "", duration = "", notes = ""] = rows[i].map((c) => c.trim());
    const durationMs = parseDuration(duration);
    if (durationMs == null) {
      errors.push(`${i + 1}행: 길이 "${duration}"을(를) 해석할 수 없음`);
      continue;
    }
    timers.push({ title, speaker, durationMs, notes });
  }
  return { timers, errors };
}
