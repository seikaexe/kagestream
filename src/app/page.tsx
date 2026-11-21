import Link from "next/link";
import { Badge, SectionHeader } from "@/components/ui/layout";
import { MediaCard, MediaGrid } from "@/components/media/media-card";
import { animeHref, mangaHref, webtoonHref } from "@/lib/routes";
import type { AnimeSummary } from "@/types/anime";
import type { MangaSummary } from "@/types/manga";
import type { WebtoonSummary } from "@/types/webtoon";
import type { SourceFailure } from "@/types/common";
import { getHomeData } from "@/services/home";

export const dynamic = "force-dynamic";

function SourceFailures({ failures }: { failures: SourceFailure[] }) {
  if (failures.length === 0) return null;
  return (
    <ul className="mb-6 flex flex-wrap gap-2 text-xs text-subtle" role="note">
      {failures.map((failure, index) => (
        <li key={index} className="rounded-full border border-border px-2.5 py-1">
          {failure.source}: {failure.message}
        </li>
      ))}
    </ul>
  );
}

function AnimeChips({ genres }: { genres: { id: string; name: string }[] }) {
  return (
    <section className="flex flex-wrap gap-1.5" aria-label="Genre Anime">
      {genres.map((genre) => (
        <Badge key={genre.id}>
          <Link
            href={`/anime?genre=${encodeURIComponent(genre.name)}`}
            className="text-inherit transition-colors hover:text-foreground"
          >
            {genre.name}
          </Link>
        </Badge>
      ))}
    </section>
  );
}

function AnimeSection({
  section
}: {
  section: { id: string; title: string; subtitle?: string; href?: string; items: AnimeSummary[] };
}) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title={section.title} subtitle={section.subtitle} href={section.href} />
      {section.items.length > 0 ? (
        <MediaGrid>
          {section.items.map((item) => (
            <MediaCard
              key={item.id}
              href={animeHref(item.id)}
              title={item.title}
              image={item.poster ?? item.cover}
              meta={[item.type, item.year, item.status].filter(Boolean).join(" · ") || undefined}
            />
          ))}
        </MediaGrid>
      ) : null}
    </section>
  );
}

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <div className="flex flex-col gap-10">
      <SourceFailures failures={data.anime.failures} />
      {data.anime.sections.map((section) => (
        <AnimeSection key={section.id} section={section} />
      ))}
      {data.manga.length > 0 ? (
        <section className="flex flex-col gap-3">
          <SectionHeader title="Manga baru" subtitle="Resep manga Indonesia" href="/manga" />
          <MediaGrid>
            {data.manga.map((item: MangaSummary) => (
              <MediaCard
                key={`${item.source}:${item.id}`}
                href={mangaHref(item.source, item.id)}
                title={item.title}
                image={item.cover}
                meta={[item.author, item.latestChapter].filter(Boolean).join(" · ") || undefined}
                secondary={item.status}
              />
            ))}
          </MediaGrid>
        </section>
      ) : null}
      {data.webtoons.length > 0 ? (
        <section className="flex flex-col gap-3">
          <SectionHeader title="Webtoon baru" subtitle="Resep WEBTOON Indonesia" href="/webtoon" />
          <MediaGrid>
            {data.webtoons.map((item: WebtoonSummary) => (
              <MediaCard
                key={item.id}
                href={webtoonHref(item)}
                title={item.title}
                image={item.cover}
                meta={[item.genre, item.author].filter(Boolean).join(" · ") || undefined}
                aspect="portrait"
              />
            ))}
          </MediaGrid>
        </section>
      ) : null}
      {data.anime.genres.length > 0 ? <AnimeChips genres={data.anime.genres.slice(0, 10)} /> : null}
    </div>
  );
}
