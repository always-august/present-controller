import { str, type RoomPageProps } from "@/lib/pageProps";
import { ControllerView } from "@/views/ControllerView";

export default async function ControllerPage({ params, searchParams }: RoomPageProps) {
  const { roomId } = await params;
  const sp = await searchParams;
  return <ControllerView roomId={roomId} controllerKey={str(sp, "key")} />;
}
