import { PageHeader } from "@/components/ui/layout";
import { Poster } from "@/components/media/poster";
import { formatCompact, stripHtml } from "@/lib/utils/text";
import type { MangaSource } from "@/services/manga";
import { getMangaDetail } from "@/services/manga";
import { ChapterList } from "./chapter-list";

export const dynamic = "force-dynamic";

export default async function MangaDetailPage({
  params
}: {
  params: Promise<{ source: MangaSource; id: string }>;
}) {
  const { source, id } = await params;
  const manga = await getMangaDetail(source, id);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid items-start gap-8 lg:grid-cols-[24rem_1fr] xl:grid-cols-[28rem_1fr]">
        {manga.cover ? <Poster src={manga.cover} alt={manga.title} title={manga.title} priority /> : null}
        <div className="space-y-5">
          <PageHeader
            eyebrow={manga.status ?? manga.language?.toUpperCase()}
            title={manga.title}
            description={manga.description ? stripHtml(manga.description) : undefined}
          />
          <div className="flex flex-wrap gap-2">
            {[manga.kind, manga.language, manga.status, manga.year].filter(Boolean).map((value, index) => (
              <span key={index} className="inline-flex rounded-full border border-border px-2.5 py-0.5 text-xs text-subtle">
                {value}
              </span>
            ))}
            {manga.rating !== undefined ? <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-subtle">{manga.rating}</span> : null}
            {manga.bookmarks !== undefined ? <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-subtle">{formatCompact(manga.bookmarks)} bookmark</span> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {(manga.author ? [manga.author] : []).concat(manga.artist ? [manga.artist] : []).map((role, index) => (
              <span key={index} className="text-xs text-subtle">
                {role}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {manga.genres.map((genre) => (
              <span key={genre} className="text-xs text-muted">#{genre}</span>
            ))}
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Deskripsi</h2>
            <p className="text-sm leading-relaxed text-muted">{manga.description ? stripHtml(manga.description) : "Deskripsi tidak tersedia."}</p>
          </div>
        </div>
      </div>

      <ChapterList manga={manga} initial={manga.chapters} />
    </div>
  );
}
