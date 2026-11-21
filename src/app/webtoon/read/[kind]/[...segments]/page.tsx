import { notFound } from "next/navigation";
import { getViewer } from "@/services/webtoon/webtoon";
import { parseWebtoonReadSegments } from "@/lib/routes";
import { WebtoonViewer } from "@/components/media/webtoon-viewer";
import type { WebtoonKind } from "@/types/webtoon";

export const dynamic = "force-dynamic";

export default async function WebtoonReadPage({
  params
}: {
  params: Promise<{ kind: string; segments: string[] }>;
}) {
  const { kind, segments } = await params;
  const webtoonKind: WebtoonKind = kind === "canvas" ? "canvas" : "original";
  const route = parseWebtoonReadSegments(webtoonKind, segments);
  if (!route || !route.episode) notFound();

  const viewer = await getViewer(route.id, route.episode, {
    kind: webtoonKind,
    genre: route.genre,
    slug: route.slug
  });

  return (
    <WebtoonViewer
      webtoon={viewer.webtoon}
      episode={viewer.episode}
      images={viewer.images}
      prev={viewer.prev}
      next={viewer.next}
    />
  );
}
