import type { Metadata } from "next";
import { SoloView } from "@/views/SoloView";

export const metadata: Metadata = { title: "혼자 발표하기 — 마부" };

export default function SoloPage() {
  return <SoloView />;
}
