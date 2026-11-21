import { PageHeader, SectionHeader } from "@/components/ui/layout";
import { EmptyState } from "@/components/ui/states";
import { WebtoonCard } from "@/components/media/content-cards";
import { WEBTOON_GENRES } from "@/lib/constants";
import { getCanvas, getOriginals } from "@/services/webtoon/webtoon";
import type { WebtoonSummary } from "@/types/webtoon";

export const dynamic = "force-dynamic";

function cardGrid(items: WebtoonSummary[]) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item) => (
        <WebtoonCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export default async function WebtoonHomePage() {
  const [originals, canvas] = await Promise.all([getOriginals({ page: 0 }), getCanvas({ page: 0 })]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="WEBTOON"
        title="Webtoon Indonesia"
        description="Resep lengkap dari WEBTOON Original dan WEBTOON Canvas. Jelajahi genre dan mulai baca sekarang juga."
      />

      <SectionHeader title="Original" subtitle="Resep WEBTOON Original yang paling populer sekarang" href="/webtoon/original" />
      {originals.items.length > 0 ? cardGrid(originals.items) : (
        <EmptyState title="Belum ada original" description="Coba lagi nanti." />
      )}

      <SectionHeader title="Canvas" subtitle="Resep baru dari WEBTOON Canvas" href="/webtoon/canvas" />
      {canvas.items.length > 0 ? cardGrid(canvas.items) : (
        <EmptyState title="Belum ada canvas" description="Coba lagi nanti." />
      )}

      <SectionHeader title="Genre" />
      <div className="flex flex-wrap gap-2">
          {WEBTOON_GENRES.filter((genre) => genre.slug).map((genre) => (
            <a
              key={genre.slug}
              href={`/webtoon/original?genre=${encodeURIComponent(genre.slug)}`}
              className="rounded-md border border-border px-3 py-1 text-xs text-muted transition-colors hover:border-strong hover:text-foreground"
            >
              {genre.label}
            </a>
          ))}
        </div>
    </div>
  );
}
