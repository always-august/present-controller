import type { RoomPageProps } from "@/lib/pageProps";
import { AskView } from "@/views/AskView";

export default async function AskPage({ params }: RoomPageProps) {
  const { roomId } = await params;
  return <AskView roomId={roomId} />;
}
