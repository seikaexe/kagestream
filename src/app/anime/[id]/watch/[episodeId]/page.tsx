import { getAnimeWatch } from "@/services/anime";
import { WatchScreen } from "./watch-screen";

export const dynamic = "force-dynamic";

export default async function WatchPage({ params }: { params: Promise<{ id: string; episodeId: string }> }) {
  const { id, episodeId } = await params;
  const data = await getAnimeWatch(episodeId);
  return <WatchScreen animeId={id} data={data} />;
}
