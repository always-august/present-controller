"use client";
import { useCallback, useEffect, useState } from "react";
import type { Timer } from "../../shared/types";
import { BrandMark } from "../components/BrandMark";
import { ConnectionBadge } from "../components/ConnectionBadge";
import { CsvImportDialog } from "../components/CsvImportDialog";
import { CurrentTimerCard } from "../components/CurrentTimerCard";
import { ControllerTour, CONTROLLER_TOUR_KEY } from "../components/ControllerTour";
import { MessagePanel } from "../components/MessagePanel";
import { RoomGate } from "../components/RoomGate";
import { SettingsDialog } from "../components/SettingsDialog";
import { ShareDialog } from "../components/ShareDialog";
import { TimerEditor } from "../components/TimerEditor";
import { TimerList } from "../components/TimerList";
import { Tooltip } from "../components/Tooltip";
import { useTourSeen } from "../components/Tour";
import { useRoomConnection } from "../hooks/useRoomConnection";
import { useRoomStore } from "../store/room";

type Dialog = null | "share" | "settings" | "csv" | { edit: Timer | null };

export function ControllerView({ roomId, controllerKey }: { roomId: string; controllerKey: string }) {
  useRoomConnection(roomId, controllerKey);
  const roomName = useRoomStore((s) => s.room?.name ?? "");
  const send = useRoomStore((s) => s.send);
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = useCallback(() => setDialog(null), []);
  const connected = useRoomStore((s) => s.connected);
  const { seen: tourSeen, markSeen } = useTourSeen(CONTROLLER_TOUR_KEY);
  const [tourOpen, setTourOpen] = useState(false);
  // 처음 온 사람에게는 연결이 끝난 뒤 자동으로 튜토리얼을 연다
  useEffect(() => {
    if (tourSeen === false && connected) setTourOpen(true);
  }, [tourSeen, connected]);
  const closeTour = useCallback(
    (dontShowAgain: boolean) => {
      setTourOpen(false);
      if (dontShowAgain) markSeen();
    },
    [markSeen],
  );

  // 단축키: Space 재생/일시정지, N 다음, P 이전, R 리셋. 입력창이나 모달이 열려 있으면 무시
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
      if (typing || dialog || tourOpen || e.metaKey || e.ctrlKey || e.altKey) return;
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
  }, [send, dialog, tourOpen]);

  return (
    <RoomGate requireController>
      <div className="flex min-h-screen flex-col lg:h-screen">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white/80 px-4 py-2 backdrop-blur-md">
          <BrandMark />
          <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">{roomName || "이름 없는 방"}</h1>
          <ConnectionBadge />
          <button className="btn btn-ghost btn-sm text-muted" onClick={() => setTourOpen(true)}>
            튜토리얼
          </button>
          <Tooltip text="행사 이름, 뷰어에 보일 요소, 알림음, 시간 형식을 바꿔요" side="bottom">
            <button className="btn btn-sm" data-tour="settings" onClick={() => setDialog("settings")}>
              설정
            </button>
          </Tooltip>
          <Tooltip text="뷰어와 청중 질문 링크, QR 코드를 복사해요" side="bottom">
            <button className="btn btn-primary btn-sm" data-tour="share" onClick={() => setDialog("share")}>
              링크 공유
            </button>
          </Tooltip>
        </header>

        <main className="grid flex-1 gap-4 bg-panel-2 p-4 lg:min-h-0 lg:grid-cols-[320px_minmax(0,1fr)_360px] lg:grid-rows-[minmax(0,1fr)]">
          <section className="min-h-[300px] lg:min-h-0" data-tour="timers">
            <TimerList onEdit={(t) => setDialog({ edit: t })} onAdd={() => setDialog({ edit: null })} onImport={() => setDialog("csv")} />
          </section>
          <section className="lg:min-h-0 lg:overflow-y-auto">
            <CurrentTimerCard large />
          </section>
          <section className="min-h-[400px] lg:min-h-0" data-tour="messages">
            <MessagePanel />
          </section>
        </main>

        <ControllerTour open={tourOpen} onClose={closeTour} />
        <ShareDialog open={dialog === "share"} onClose={close} roomId={roomId} controllerKey={controllerKey} />
        <SettingsDialog open={dialog === "settings"} onClose={close} />
        <CsvImportDialog open={dialog === "csv"} onClose={close} />
        <TimerEditor open={typeof dialog === "object" && dialog !== null && "edit" in dialog} timer={typeof dialog === "object" && dialog !== null ? dialog.edit : null} onClose={close} />
      </div>
    </RoomGate>
  );
}
