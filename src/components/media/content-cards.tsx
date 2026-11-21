import type { AnimeSummary } from "@/types/anime";
import type { MangaSummary } from "@/types/manga";
import type { WebtoonSummary } from "@/types/webtoon";
import { animeHref, mangaHref, webtoonHref } from "@/lib/routes";
import { Badge } from "@/components/ui/layout";
import { MediaCard } from "./media-card";

const SOURCE_LABELS: Record<MangaSummary["source"], string> = {
  shinigami: "Shinigami",
  komiku: "Komiku",
  mangadex: "MangaDex"
};

export function AnimeCard({
  item,
  priority,
  className
}: {
  item: AnimeSummary;
  priority?: boolean;
  className?: string;
}) {
  const meta = [item.type, item.year, item.status].filter(Boolean).join(" · ");
  return (
    <MediaCard
      href={animeHref(item.id)}
      title={item.title}
      image={item.poster ?? item.cover}
      meta={meta || undefined}
      score={item.score ? Math.round(item.score) : undefined}
      views={item.score ? undefined : item.views}
      badge={
        item.status === "Ongoing" ? (
          <Badge tone="strong" className="bg-black/70 text-white">
            Ongoing
          </Badge>
        ) : undefined
      }
      priority={priority}
      className={className}
    />
  );
}

export function MangaCard({ item, className }: { item: MangaSummary; className?: string }) {
  const meta = [SOURCE_LABELS[item.source], item.latestChapter].filter(Boolean).join(" · ");
  return (
    <MediaCard
      href={mangaHref(item.source, item.id)}
      title={item.title}
      image={item.cover}
      meta={meta || undefined}
      secondary={item.status || undefined}
      {...(item.rating ? { score: Math.round(item.rating * 10) } : {})}
      className={className}
    />
  );
}

export function WebtoonCard({ item, className }: { item: WebtoonSummary; className?: string }) {
  return (
    <MediaCard
      href={webtoonHref(item)}
      title={item.title}
      image={item.cover}
      meta={[item.genre, item.author].filter(Boolean).join(" · ") || undefined}
      badge={
        <Badge tone="strong" className="bg-black/70 text-white">
          {item.kind === "canvas" ? "Canvas" : "Original"}
        </Badge>
      }
      aspect="portrait"
      className={className}
    />
  );
}
