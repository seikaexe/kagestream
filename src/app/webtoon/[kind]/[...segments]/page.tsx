import { PageHeader } from "@/components/ui/layout";
import { Poster } from "@/components/media/poster";
import { EpisodesTable } from "./episodes-table";
import { getDetail } from "@/services/webtoon/webtoon";
import { notFound } from "next/navigation";
import { parseWebtoonDetailSegments, webtoonReaderHref } from "@/lib/routes";
import type { WebtoonKind } from "@/types/webtoon";

export const dynamic = "force-dynamic";

export default async function WebtoonDetailPage({
  params
}: {
  params: Promise<{ kind: string; segments: string[] }>;
}) {
  const { kind, segments } = await params;
  const webtoonKind: WebtoonKind = kind === "canvas" ? "canvas" : "original";
  const route = parseWebtoonDetailSegments(webtoonKind, segments);
  if (!route) notFound();

  const detail = await getDetail(route.id, {
    kind: webtoonKind,
    genre: route.genre,
    slug: route.slug
  });

  const owner = detail.author ? `oleh ${detail.author}` : "";
  const meta = [detail.genre, owner].filter(Boolean).join(" · ");


  return (
    <div className="flex flex-col gap-8">
      <div className="grid items-start gap-8 lg:grid-cols-[24rem_1fr] xl:grid-cols-[28rem_1fr]">
        {detail.cover ? <Poster src={detail.cover} alt={detail.title} title={detail.title} priority /> : null}
        <div className="space-y-5">
          <PageHeader
            eyebrow={detail.genre}
            title={detail.title}
            description={detail.description}
          />
          <div className="flex flex-wrap gap-3 text-xs text-subtle">
            {meta ? <span>{meta}</span> : null}
            {detail.subscribers ? <span>{detail.subscribers} reader</span> : null}
            {detail.episodeCount !== undefined ? <span>{detail.episodeCount} episode</span> : null}
          </div>
        </div>
      </div>

      {detail.episodes.length > 0 ? (
        <div>
          <h2 className="mb-4 text-base font-semibold text-foreground">Episode</h2>
          <EpisodesTable
            episodes={detail.episodes}
            detailHref={(episodeNo) =>
              webtoonReaderHref({ id: detail.id, kind: webtoonKind, genre: detail.genre, slug: detail.slug }, episodeNo)
            }
          />
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-xs text-muted">
          Episode belum tersedia untuk webtoon ini. Coba lagi beberapa saat lagi.
        </div>
      )}
    </div>
  );
}
