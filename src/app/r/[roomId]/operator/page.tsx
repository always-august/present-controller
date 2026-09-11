import { str, type RoomPageProps } from "@/lib/pageProps";
import { OperatorView } from "@/views/OperatorView";

export default async function OperatorPage({ params, searchParams }: RoomPageProps) {
  const { roomId } = await params;
  const sp = await searchParams;
  return <OperatorView roomId={roomId} controllerKey={str(sp, "key")} />;
}
