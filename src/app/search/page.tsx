import Link from "next/link";
import { PageHeader } from "@/components/ui/layout";
import { EmptyState } from "@/components/ui/states";
import { Poster } from "@/components/media/poster";
import type { AnimeSummary } from "@/types/anime";
import type { MangaSummary } from "@/types/manga";
import type { WebtoonSummary } from "@/types/webtoon";
import { animeHref, mangaHref, webtoonHref } from "@/lib/routes";
import { searchKeywordSchema } from "@/lib/validators/query";
import { globalSearch } from "@/services/search";

export const dynamic = "force-dynamic";

type Query = Record<string, string | string[] | undefined>;

export default async function SearchPage({ searchParams }: { searchParams: Promise<Query> }) {
  const raw = await searchParams;
  const query = searchKeywordSchema.parse(raw.q ?? "");

  const result = await globalSearch(query);

  const filtered: { kind: string; items: number; label: string; page: () => string }[] = [
    { kind: "anime", items: result.anime.length, label: "Anime", page: () => `/search?q=${encodeURIComponent(query)}&category=anime` },
    { kind: "manga", items: result.manga.length, label: "Manga", page: () => `/search?q=${encodeURIComponent(query)}&category=manga` },
    { kind: "webtoon", items: result.webtoons.length, label: "Webtoon", page: () => `/search?q=${encodeURIComponent(query)}&category=webtoon` }
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Hasil pencarian"
        title={`"${query}"`}
        description={result.anime.length + result.manga.length + result.webtoons.length > 0 ? `Ditemukan ${result.anime.length + result.manga.length + result.webtoons.length} hasil.` : "Tidak ada hasil yang cocok."}
      />

      <div className="flex flex-wrap gap-2">
        {filtered.map((entry) => (
          <Link
            key={entry.kind}
            href={entry.page()}
            className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${entry.items > 0 ? "border-strong bg-strong text-on-strong" : "border-border text-muted hover:bg-surface-soft hover:text-foreground"}`}
          >
            {entry.label} {entry.items}
          </Link>
        ))}
      </div>

      {result.anime.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-foreground">Anime</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {result.anime.map((item: AnimeSummary) => (
              <article key={item.id} className="group min-w-0">
                <Link href={animeHref(item.id)} className="block">
                  <Poster src={item.poster ?? item.cover} alt={item.title} title={item.title} className="w-full" />
                  <div className="mt-2.5 space-y-1">
                    <h3 className="line-clamp-2 text-sm font-medium text-foreground">{item.title}</h3>
                    <p className="truncate text-xs text-muted">{[item.type, item.year, item.status].filter(Boolean).join(" · ") || "Aplikasi"}</p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {result.manga.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-foreground">Manga</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {result.manga.map((item: MangaSummary) => (
              <article key={`${item.source}:${item.id}`}>
                <Link href={mangaHref(item.source, item.id)} className="block">
                  <Poster src={item.cover} alt={item.title} title={item.title} className="w-full" />
                  <div className="mt-2.5 space-y-1">
                    <h3 className="line-clamp-2 text-sm font-medium text-foreground">{item.title}</h3>
                    <p className="truncate text-xs text-muted">{item.source} · {item.latestChapter ?? ""}</p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {result.webtoons.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-foreground">Webtoon</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {result.webtoons.map((item: WebtoonSummary) => (
              <article key={item.id}>
                <Link href={webtoonHref(item)} className="block">
                  <Poster src={item.cover} alt={item.title} title={item.title} className="w-full aspect-[3/4]" />
                  <div className="mt-2.5 space-y-1">
                    <h3 className="line-clamp-2 text-sm font-medium text-foreground">{item.title}</h3>
                    <p className="truncate text-xs text-muted">{[item.genre, item.author].filter(Boolean).join(" · ")}</p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {result.anime.length === 0 && result.manga.length === 0 && result.webtoons.length === 0 ? (
        <EmptyState
          title="Belum ada yang cocok"
          description={`Mungkin kata kunci "${query}" terlalu spesifik atau belum ada judul yang sama.`}
        />
      ) : null}
    </div>
  );
}
