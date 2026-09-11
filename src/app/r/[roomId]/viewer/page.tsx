import { str, type RoomPageProps } from "@/lib/pageProps";
import { ViewerView } from "@/views/ViewerView";

export default async function ViewerPage({ params, searchParams }: RoomPageProps) {
  const { roomId } = await params;
  const sp = await searchParams;
  return (
    <ViewerView
      roomId={roomId}
      options={{
        chroma: str(sp, "chroma"),
        hideTitle: str(sp, "hideTitle") === "1",
        hideSpeaker: str(sp, "hideSpeaker") === "1",
        hideClock: str(sp, "hideClock") === "1",
        hideProgress: str(sp, "hideProgress") === "1",
        hideMessages: str(sp, "hideMessages") === "1",
      }}
    />
  );
}
