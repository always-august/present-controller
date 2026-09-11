"use client";
import { useEffect } from "react";
import { useRoomStore } from "../store/room";

/** 페이지 마운트 시 방에 연결하고 언마운트 시 끊는다. */
export function useRoomConnection(roomId: string, key = "") {
  const connect = useRoomStore((s) => s.connect);
  const disconnect = useRoomStore((s) => s.disconnect);
  useEffect(() => {
    if (!roomId) return;
    connect(roomId, key);
    return () => disconnect();
  }, [roomId, key, connect, disconnect]);
}
