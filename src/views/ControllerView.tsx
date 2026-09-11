"use client";
import { useCallback, useEffect, useState } from "react";
import type { Timer } from "../../shared/types";
import { BrandMark } from "../components/BrandMark";
import { ConnectionBadge } from "../components/ConnectionBadge";
import { CsvImportDialog } from "../components/CsvImportDialog";
import { CurrentTimerCard } from "../components/CurrentTimerCard";
import { MessagePanel } from "../components/MessagePanel";
import { RoomGate } from "../components/RoomGate";
import { SettingsDialog } from "../components/SettingsDialog";
import { ShareDialog } from "../components/ShareDialog";
import { TimerEditor } from "../components/TimerEditor";
import { TimerList } from "../components/TimerList";
import { HelpList, Tooltip } from "../components/Tooltip";
import { useRoomConnection } from "../hooks/useRoomConnection";
import { useRoomStore } from "../store/room";

type Dialog = null | "share" | "settings" | "csv" | { edit: Timer | null };

export function ControllerView({ roomId, controllerKey }: { roomId: string; controllerKey: string }) {
  useRoomConnection(roomId, controllerKey);
  const roomName = useRoomStore((s) => s.room?.name ?? "");
  const send = useRoomStore((s) => s.send);
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = useCallback(() => setDialog(null), []);

  // 단축키: Space 재생/일시정지, N 다음, P 이전, R 리셋. 입력창이나 모달이 열려 있으면 무시
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
      if (typing || dialog || e.metaKey || e.ctrlKey || e.altKey) return;
      const status = useRoomStore.getState().room?.playback.status;
      switch (e.key) {
        case " ":
          e.preventDefault();
          send({ type: status === "running" ? "playback:pause" : "playback:start", payload: {} });
          break;
        case "n":
        case "N":
          send({ type: "playback:next", payload: {} });
          break;
        case "p":
        case "P":
          send({ type: "playback:prev", payload: {} });
          break;
        case "r":
        case "R":
          send({ type: "playback:reset", payload: {} });
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [send, dialog]);

  return (
    <RoomGate requireController>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white/80 px-4 py-2 backdrop-blur-md">
          <BrandMark />
          <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">{roomName || "이름 없는 방"}</h1>
          <ConnectionBadge />
          <Tooltip
            side="bottom"
            align="end"
            content={<HelpList title="단축키" items={[<><kbd>Space</kbd> 재생과 일시정지</>, <><kbd>N</kbd> 다음 세션</>, <><kbd>P</kbd> 이전 세션</>, <><kbd>R</kbd> 리셋</>, "입력창에 커서가 있을 때는 동작하지 않습니다"]} />}
          >
            <span className="hidden cursor-default text-[11px] text-muted lg:inline">단축키 ⌨</span>
          </Tooltip>
          <Tooltip text="행사 이름, 뷰어에 보일 요소, 알림음, 시간 형식을 바꿉니다" side="bottom">
            <button className="btn btn-sm" onClick={() => setDialog("settings")}>
              설정
            </button>
          </Tooltip>
          <Tooltip text="뷰어, 아젠다, 오퍼레이터 링크와 QR 코드를 복사합니다" side="bottom">
            <button className="btn btn-primary btn-sm" onClick={() => setDialog("share")}>
              링크 공유
            </button>
          </Tooltip>
        </header>

        <main className="grid flex-1 gap-4 bg-panel-2 p-4 lg:grid-cols-[320px_minmax(0,1fr)_360px] lg:grid-rows-[minmax(0,1fr)]">
          <section className="min-h-[300px] lg:h-[calc(100vh-80px)]">
            <TimerList onEdit={(t) => setDialog({ edit: t })} onAdd={() => setDialog({ edit: null })} onImport={() => setDialog("csv")} />
          </section>
          <section className="lg:h-[calc(100vh-80px)]">
            <CurrentTimerCard large />
          </section>
          <section className="min-h-[400px] lg:h-[calc(100vh-80px)]">
            <MessagePanel />
          </section>
        </main>

        <ShareDialog open={dialog === "share"} onClose={close} roomId={roomId} controllerKey={controllerKey} />
        <SettingsDialog open={dialog === "settings"} onClose={close} />
        <CsvImportDialog open={dialog === "csv"} onClose={close} />
        <TimerEditor open={typeof dialog === "object" && dialog !== null && "edit" in dialog} timer={typeof dialog === "object" && dialog !== null ? dialog.edit : null} onClose={close} />
      </div>
    </RoomGate>
  );
}
