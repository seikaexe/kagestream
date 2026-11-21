import { Badge, PageHeader, Pagination } from "@/components/ui/layout";
import { EmptyState } from "@/components/ui/states";
import { WebtoonCard } from "@/components/media/content-cards";

import { WEBTOON_GENRES, WEBTOON_ORIGINAL_DAYS } from "@/lib/constants";
import { webtoonCatalogQuerySchema } from "@/lib/validators/query";
import { getCanvas, getOriginals } from "@/services/webtoon/webtoon";

type Query = Record<string, string | string[] | undefined>;
type Kind = "original" | "canvas";

export async function WebtoonCatalogPage({
  searchParams,
  kind,
  defaultDay
}: {
  searchParams: Promise<Query>;
  kind: Kind;
  defaultDay?: string;
}) {
  const params = webtoonCatalogQuerySchema.parse(await searchParams);
  const result =
    kind === "canvas"
      ? await getCanvas(params)
      : await getOriginals({ ...params, day: params.day || defaultDay });

  const buildHref = (page: number) =>
    `/webtoon/${kind}?${new URLSearchParams({
      q: params.q,
      genre: params.genre,
      kind: params.kind,
      page: String(page)
    }).toString()}`;

  const dayFilter =
    kind === "original" && params.day ? <Badge>{params.day}</Badge> : null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="WEBTOON"
        title={kind === "canvas" ? "Webtoon Canvas" : "Webtoon Original"}
        description={
          kind === "canvas"
            ? "Resep hasil dari WEBTOON Canvas — dicoba dulu oleh kreator, cepat berkembang."
            : "Resep paling populer dari WEBTOON Original — ada setiap hari di kalender."
        }
        action={dayFilter ?? undefined}
      />

      {kind === "original" ? (
        <div className="flex flex-wrap gap-2">
          {[...WEBTOON_ORIGINAL_DAYS].map((day) => (
            <a
              key={day.slug}
              href={`/webtoon/original?day=${day.slug}${params.genre ? `&genre=${encodeURIComponent(params.genre)}` : ""}`}
              className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                params.day === day.slug
                  ? "border-strong bg-strong text-on-strong"
                  : "border-border text-muted hover:bg-surface-soft hover:text-foreground"
              }`}
            >
              {day.label}
            </a>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {WEBTOON_GENRES.filter((genre) => genre.slug).map((genre) => (
          <a
            key={genre.slug}
            href={`/webtoon/${kind}?genre=${encodeURIComponent(genre.slug)}`}
            className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
              params.genre === genre.slug
                ? "border-strong bg-strong text-on-strong"
                : "border-border text-muted hover:bg-surface-soft hover:text-foreground"
            }`}
          >
            {genre.label}
          </a>
        ))}
      </div>

      {result.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {result.items.map((item) => (
            <WebtoonCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState title={`Belum ada ${kind === "canvas" ? "webtoon canvas" : "original"}`} description="Coba filter lain atau beberapa saat lagi." />
      )}

      <Pagination page={params.page} hasMore={result.hasMore} buildHref={buildHref} />
    </div>
  );
}
