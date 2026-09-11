"use client";
import type { RoomSettings } from "../../shared/types";
import { useRoomStore } from "../store/room";
import { Modal } from "./Modal";

const TOGGLES: { key: keyof RoomSettings; label: string; desc: string }[] = [
  { key: "showTitle", label: "제목 표시", desc: "뷰어 상단에 세션 제목" },
  { key: "showSpeaker", label: "발표자 표시", desc: "뷰어 상단에 발표자 이름" },
  { key: "showTimeOfDay", label: "현재 시각 표시", desc: "뷰어 우상단 시계" },
  { key: "showProgressBar", label: "진행 바 표시", desc: "뷰어 하단 진행률" },
  { key: "chimeEnabled", label: "알림음", desc: "종료 안내 시점과 0초 도달 시 뷰어에서 울림" },
];

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useRoomStore((s) => s.room?.settings);
  const name = useRoomStore((s) => s.room?.name ?? "");
  const send = useRoomStore((s) => s.send);
  if (!settings) return null;
  const patch = (p: Partial<RoomSettings>) => send({ type: "settings:update", payload: p });

  return (
    <Modal open={open} onClose={onClose} title="방 설정">
      <div className="space-y-4">
        <div>
          <label className="label">행사 이름</label>
          <input
            className="input"
            defaultValue={name}
            onBlur={(e) => e.target.value !== name && send({ type: "room:rename", payload: { name: e.target.value } })}
          />
        </div>
        <div className="space-y-2">
          {TOGGLES.map((t) => (
            <label key={t.key} className="flex cursor-pointer items-center justify-between rounded-lg border border-line px-3 py-2">
              <span>
                <span className="block text-sm">{t.label}</span>
                <span className="block text-xs text-muted">{t.desc}</span>
              </span>
              <input type="checkbox" checked={Boolean(settings[t.key])} onChange={(e) => patch({ [t.key]: e.target.checked })} />
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">시간 형식</label>
            <select className="input" value={settings.timeFormat} onChange={(e) => patch({ timeFormat: e.target.value as "12h" | "24h" })}>
              <option value="24h">24시간</option>
              <option value="12h">12시간</option>
            </select>
          </div>
          <div>
            <label className="label">시간대</label>
            <input className="input" defaultValue={settings.timezone} onBlur={(e) => patch({ timezone: e.target.value || "Asia/Seoul" })} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
