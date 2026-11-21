import Link from "next/link";
import { animeCatalogQuerySchema } from "@/lib/validators/query";
import { ANIME_SORTS } from "@/lib/constants";
import { getAnimeCatalog, getAnimeGenres } from "@/services/anime";
import type { AnimeSummary } from "@/types/anime";
import { AnimeCard } from "@/components/media/content-cards";
import { MediaGrid } from "@/components/media/media-card";
import { PageHeader, Pagination, SectionHeader } from "@/components/ui/layout";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type Query = Record<string, string | string[] | undefined>;

function toUrl(params: { q?: string; genre?: string; status?: string; sort?: string }, page: number): string {
  const search = new URLSearchParams();
  search.set("page", String(page));
  if (params.q) search.set("q", params.q);
  if (params.genre) search.set("genre", params.genre);
  if (params.status) search.set("status", params.status);
  if (params.sort) search.set("sort", params.sort);
  return `/anime?${search.toString()}`;
}

export default async function AnimeCatalogPage({ searchParams }: { searchParams: Promise<Query> }) {
  const params = animeCatalogQuerySchema.parse(await searchParams);
  const [result, genres] = await Promise.all([
    getAnimeCatalog(params).catch(() => ({ items: [], page: params.page, hasMore: false })),
    getAnimeGenres().catch(() => [])
  ]);

  const hasFilters = Boolean(params.q || params.genre || params.status || params.sort !== "views");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Anime"
        description="Jelajahi jutaan penonton dengan anime dari Animein. Filter berdasarkan genre, status, dan tingkat kepopuleran."
      />

      <form action="/anime" method="get" className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-surface p-3">
        <label className="flex w-48 flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Kata kunci</span>
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Cari anime"
            aria-label="Kata kunci anime"
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-strong"
          />
        </label>
        <label className="flex w-40 flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Genre</span>
          <select
            name="genre"
            defaultValue={params.genre}
            aria-label="Filter genre"
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
          >
            <option value="">Semua genre</option>
            {genres.map((genre) => (
              <option key={genre.id} value={genre.name}>
                {genre.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex w-40 flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Status</span>
          <select
            name="status"
            defaultValue={params.status}
            aria-label="Filter status"
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
          >
            {[
              { value: "", label: "Semua status" },
              { value: "Ongoing", label: "Ongoing" },
              { value: "Selesai", label: "Selesai" },
              { value: "Belum Tayang", label: "Belum tayang" },
              { value: "Hiatus", label: "Hiatus" }
            ].map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex w-36 flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Urutkan</span>
          <select
            name="sort"
            defaultValue={params.sort}
            aria-label="Urutkan"
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
          >
            {ANIME_SORTS.map((sort) => (
              <option key={sort.id} value={sort.id}>
                {sort.label}
              </option>
            ))}
          </select>
        </label>
        <input type="hidden" name="page" value="0" />
        <Button type="submit" variant="primary">Cari</Button>
        {hasFilters ? (
          <Link
            href="/anime?page=0"
            className="inline-flex h-10 items-center rounded-md px-4 text-sm text-muted transition-colors hover:bg-surface-soft hover:text-foreground"
          >
            Reset
          </Link>
        ) : null}
      </form>

      <SectionHeader title="Hasil" subtitle={hasFilters ? `Menampilkan ${result.items.length} anime` : `Semua anime (${result.items.length} penggemar)`} />

      {result.items.length > 0 ? (
        <MediaGrid>
          {result.items.map((item: AnimeSummary) => (
            <AnimeCard key={item.id} item={item} />
          ))}
        </MediaGrid>
      ) : (
        <EmptyState
          title={hasFilters ? "Belum ada yang cocok" : "Belum ada anime"}
          description="Coba kata kunci atau pilih filter yang berbeda."
        />
      )}

      <Pagination
        page={params.page}
        hasMore={result.hasMore}
        buildHref={(page) => toUrl(params, page)}
      />
    </div>
  );
}
