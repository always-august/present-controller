import type { RoomPageProps } from "@/lib/pageProps";
import { AgendaView } from "@/views/AgendaView";

export default async function AgendaPage({ params }: RoomPageProps) {
  const { roomId } = await params;
  return <AgendaView roomId={roomId} />;
}
