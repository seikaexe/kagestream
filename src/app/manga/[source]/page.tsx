import { MediaGrid } from "@/components/media/media-card";
import { MangaCard } from "@/components/media/content-cards";
import { PageHeader } from "@/components/ui/layout";
import { EmptyState } from "@/components/ui/states";
import { mangaCatalogQuerySchema } from "@/lib/validators/query";
import { getMangaCatalog, type MangaSource } from "@/services/manga";

export const dynamic = "force-dynamic";

type Query = Record<string, string | string[] | undefined>;

export default async function MangaSourcePage({
  params,
  searchParams
}: {
  params: Promise<{ source: string }>;
  searchParams: Promise<Query>;
}) {
  const { source } = await params;
  const raw = await searchParams;
  const catalogParams = mangaCatalogQuerySchema.parse({ source, ...raw });

  const result = await getMangaCatalog(source as MangaSource, {
    page: catalogParams.page,
    keyword: catalogParams.q,
    genre: catalogParams.genre,
    sort: catalogParams.sort
  });

  const labels: Record<string, string> = {
    shinigami: "Shinigami — Catalog manga Indonesia",
    komiku: "Komiku — Manga Indonesia lengkap",
    mangadex: "MangaDex — Manga multi-bahasa"
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={labels[source] ?? "Katalog manga"} />
      {result.items.length > 0 ? (
        <MediaGrid>
          {result.items.map((item) => (
            <MangaCard key={`${item.source}:${item.id}`} item={item} />
          ))}
        </MediaGrid>
      ) : (
        <EmptyState title="Belum ada manga" description="Coba lagi beberapa saat lagi." />
      )}
    </div>
  );
}
