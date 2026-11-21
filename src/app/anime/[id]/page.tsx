import Link from "next/link";
import { Badge, PageHeader, SectionHeader } from "@/components/ui/layout";
import { ErrorState } from "@/components/ui/states";
import { Poster } from "@/components/media/poster";
import { animeWatchHref } from "@/lib/routes";
import { getAnimeDetail } from "@/services/anime";
import { AnimeEpisodesTable } from "./episodes-table";

export const dynamic = "force-dynamic";

export default async function AnimeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const anime = await getAnimeDetail(id);

  const meta = [
    anime.type,
    anime.year,
    anime.status,
    anime.totalEpisodes ? `${anime.totalEpisodes} ep` : undefined
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-10">
      <section className="grid items-start gap-8 lg:grid-cols-[28rem_1fr] xl:grid-cols-[32rem_1fr]">
        <Poster src={anime.poster ?? anime.cover} alt={anime.title} title={anime.title} className="w-full" priority />
        <div className="space-y-6">
          <PageHeader
            eyebrow={anime.genres[0] ?? undefined}
            title={anime.title}
            description={anime.synopsis}
            action={
              anime.episodes.length > 0 ? (
                <Link
                  href={animeWatchHref(id, anime.episodes[0].id)}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-strong px-5 text-sm font-medium text-on-strong transition-opacity hover:opacity-85"
                >
                  Watch Episode {anime.episodes[0].number}
                </Link>
              ) : null
            }
          />
          <div className="flex flex-wrap items-center gap-3">
            {meta.map((item, index) => (
              <Badge key={index}>{item}</Badge>
            ))}
            {anime.score !== undefined && anime.score !== null ? <Badge tone="strong">{(anime.score / 10).toFixed(1)}</Badge> : null}
          </div>
          {anime.synonyms ? <p className="text-xs text-muted">Judul alternatif: {anime.synonyms}</p> : null}
          {anime.studio ? <p className="text-xs text-muted">Studio: {anime.studio}</p> : null}
          <div className="flex flex-wrap gap-2" aria-label="Genre">
            {anime.genres.map((genre) => (
              <Link
                key={genre}
                href={`/anime?genre=${encodeURIComponent(genre)}`}
                className="text-xs text-muted transition-colors hover:text-foreground"
              >
                #{genre}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SectionHeader title="Episode" subtitle={`${anime.episodes.length} episode tersedia`} />
      {anime.episodes.length > 0 ? (
        <AnimeEpisodesTable episodes={anime.episodes} animeId={id} />
      ) : (
        <ErrorState
          title="Daftar episode belum tersedia"
          message="Sumber episode tidak menemukan daftar episode untuk anime ini. Buka bukan jika Anda telah memiliki sumber yang tepat."
        />
      )}
    </div>
  );
}
