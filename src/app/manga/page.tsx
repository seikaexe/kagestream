import Link from "next/link";
import { mangaCatalogQuerySchema } from "@/lib/validators/query";
import { MANGA_LANGUAGES, MANGA_SORTS } from "@/lib/constants";
import { getMangaCatalog, getMangaGenres, type MangaSource } from "@/services/manga";
import { MangaCard } from "@/components/media/content-cards";
import { MediaGrid } from "@/components/media/media-card";
import { PageHeader, Pagination, SectionHeader } from "@/components/ui/layout";
import { EmptyState } from "@/components/ui/states";

export const dynamic = "force-dynamic";

type Query = Record<string, string | string[] | undefined>;

function chipHref(patch: Record<string, string>) {
  const search = new URLSearchParams();
  Object.entries(patch).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  return `/manga?${search.toString()}`;
}

export default async function MangaCatalogPage({ searchParams }: { searchParams: Promise<Query> }) {
  const params = mangaCatalogQuerySchema.parse(await searchParams);
  const source: MangaSource = params.source === "all" ? "shinigami" : params.source;

  const [result, genres] = await Promise.all([
    getMangaCatalog(source, { ...params, keyword: params.q }),
    getMangaGenres(source).catch(() => [])
  ]);

  const info = source === "shinigami" ? "Shinigami — Catalog manga Indonesia, Manhwa, Manhua"
    : source === "komiku" ? "Komiku — Manga Indonesia lengkap"
    : "MangaDex — Manga multi-bahasa";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Manga" description={`Katalog manga Indonesia via ${["Shinigami", "Komiku", "MangaDex"][["shinigami", "komiku", "mangadex"].indexOf(source)]}.`} />

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-2">
        {([["all", "Semua"], ["shinigami", "Shinigami"], ["komiku", "Komiku"], ["mangadex", "MangaDex"]] as const).map(([value, label]) => (
          <Link
            key={value}
            href={chipHref({ source: value, page: "0", q: "", genre: "", sort: params.sort })}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${source === value ? "bg-strong text-on-strong" : "text-muted hover:bg-surface-soft hover:text-foreground"}`}
            aria-pressed={source === value}
          >
            {label}
          </Link>
        ))}
      </div>

      <form action="/manga" method="get" className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-surface p-2">
        <label className="flex w-36 flex-col gap-1">
          <span className="text-[11px] font-medium text-muted">Kata kunci</span>
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Judul"
            aria-label="Kata kunci manga"
            className="h-8 rounded border border-border bg-surface px-2 text-xs text-foreground focus-visible:border-strong outline-none"
          />
        </label>
        <label className="flex w-24 flex-col gap-1">
          <span className="text-[11px] font-medium text-muted">Bahasa</span>
          <select
            name="language"
            aria-label="Bahasa"
            className="h-8 rounded border border-border bg-surface px-2 text-xs text-foreground"
          >
            {MANGA_LANGUAGES.map((language) => (
              <option key={language.id} value={language.id} selected={params.language === language.id}>
                {language.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex w-40 flex-col gap-1">
          <span className="text-[11px] font-medium text-muted">Genre</span>
          <select
            name="genre"
            aria-label="Genre manga"
            className="h-8 rounded border border-border bg-surface px-2 text-xs text-foreground"
          >
            <option value="">Semua genre</option>
            {genres.map((genre) => (
              <option key={genre.id} value={genre.id} selected={params.genre === genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex w-40 flex-col gap-1">
          <span className="text-[11px] font-medium text-muted">Urutkan</span>
          <select
            name="sort"
            aria-label="Urutkan manga"
            className="h-8 rounded border border-border bg-surface px-2 text-xs text-foreground"
          >
            {MANGA_SORTS.map((sort) => (
              <option key={sort.id} value={sort.id} selected={params.sort === sort.id}>
                {sort.label}
              </option>
            ))}
          </select>
        </label>
        <input type="hidden" name="source" value={source} />
        <input type="hidden" name="page" value="0" />
        <button type="submit" className="inline-flex h-8 items-center gap-1.5 rounded bg-strong px-3 text-xs font-medium text-on-strong transition-opacity hover:opacity-85">
          Cari
        </button>
      </form>

      <SectionHeader title="Hasil" subtitle={info} />
      {result.items.length > 0 ? (
        <MediaGrid>
          {result.items.map((item) => (
            <MangaCard key={`${item.source}:${item.id}`} item={item} />
          ))}
        </MediaGrid>
      ) : (
        <EmptyState title="Belum ada manga" description="Coba kata kunci lain atau ganti filter." />
      )}

      <Pagination
        page={params.page}
        hasMore={result.hasMore}
        buildHref={(page) => chipHref({ source, q: params.q, genre: params.genre, language: params.language, sort: params.sort, page: String(page) })}
      />
    </div>
  );
}
