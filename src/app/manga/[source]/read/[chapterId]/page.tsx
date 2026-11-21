import { MangaReader } from "@/components/media/manga-reader";
import { getMangaReader } from "@/services/manga";
import type { MangaSource } from "@/services/manga";

export const dynamic = "force-dynamic";

export default async function MangaReaderPage({
  params
}: {
  params: Promise<{ source: MangaSource; chapterId: string }>;
}) {
  const { source, chapterId } = await params;
  const reader = await getMangaReader(source, chapterId);
  return <MangaReader source={source} reader={reader} />;
}
