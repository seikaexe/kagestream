import Link from "next/link";
import { Badge, PageHeader } from "@/components/ui/layout";
import { EmptyState } from "@/components/ui/states";
import { Poster } from "@/components/media/poster";
import { getAnimeGenres } from "@/services/anime";

export const dynamic = "force-dynamic";

export default async function AnimeGenresPage() {
  const genres = await getAnimeGenres();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Genre Anime"
        description="Pilih genre untuk menyaring katalog anime menjadi lebih spesifik."
      />
      {genres.length === 0 ? (
        <EmptyState title="Genre belum tersedia" description="Coba lagi beberapa saat lagi." />
      ) : (
        <section className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {genres.map((genre) => (
              <Link
                key={genre.id}
                href={`/anime?genre=${encodeURIComponent(genre.name)}`}
                className="flex items-center gap-4 rounded-md border border-border bg-surface px-4 py-4 hover:border-strong hover:bg-surface-soft"
              >
                {genre.image ? (
                  <Poster src={genre.image} alt="" className="h-10 w-16" />
                ) : (
                  <Badge tone="strong" className="h-10 w-16 justify-center">
                    {genre.name.slice(0, 1).toUpperCase()}
                  </Badge>
                )}
                <span className="text-sm font-medium text-foreground">{genre.name}</span>
                <span className="text-sm text-muted">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
