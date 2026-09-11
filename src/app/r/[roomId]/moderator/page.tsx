import { str, type RoomPageProps } from "@/lib/pageProps";
import { ModeratorView } from "@/views/ModeratorView";

export default async function ModeratorPage({ params, searchParams }: RoomPageProps) {
  const { roomId } = await params;
  const sp = await searchParams;
  return <ModeratorView roomId={roomId} controllerKey={str(sp, "key")} />;
}
