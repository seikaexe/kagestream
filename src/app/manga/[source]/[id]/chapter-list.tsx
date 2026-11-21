"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { mangaReaderHref } from "@/lib/routes";
import { formatDate } from "@/lib/utils/text";
import type { MangaChapter, MangaSummary } from "@/types/manga";
import type { Paginated } from "@/types/common";
import { useLibrary } from "@/components/providers/library-provider";

export function ChapterList({ manga, initial }: { manga: MangaSummary; initial: MangaChapter[] }) {
  const { addHistory, isBookmarked, toggleBookmark } = useLibrary();
  const [chapters, setChapters] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    const first = chapters[0];
    if (first) {
      addHistory({
        key: `manga:${manga.source}:${manga.id}`,
        kind: "manga",
        id: manga.id,
        title: manga.title,
        subtitle: manga.source,
        image: manga.cover,
        href: mangaReaderHref(manga.source, first.id),
        progress: `Chapter ${first.number}`
      });
    }
    // Only seed history once when the chapter list first arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/manga/chapters?source=${encodeURIComponent(manga.source)}&id=${encodeURIComponent(manga.id)}&page=${cursor + 1}`
      );
      if (!response.ok) throw new Error("Gagal memuat.");
      const data = (await response.json()) as Paginated<MangaChapter>;
      setChapters((current) => [...current, ...data.items]);
      setCursor((current) => current + 1);
    } catch {
      // Failed loads are silently ignored; the existing list remains usable.
    } finally {
      setLoading(false);
    }
  }, [manga, cursor]);

  const mangaKey = `manga:${manga.source}:${manga.id}`;
  const bookmarked = isBookmarked(mangaKey);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-foreground">Chapter ({chapters.length})</h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toggleBookmark({
              key: mangaKey,
              kind: "manga",
              id: manga.id,
              title: manga.title,
              subtitle: manga.source,
              image: manga.cover,
              href: `/manga/${manga.source}/${manga.id}`
            })}
            aria-pressed={bookmarked}
            aria-label="Bookmark manga"
          >
            {bookmarked ? "Dibookmark" : "Bookmark"}
          </Button>
          <Button type="button" variant="secondary" size="sm" disabled={loading || chapters.length === 0} onClick={() => void loadMore()}>
            {loading ? "Memuat…" : "Muat lagi"}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-surface-soft/40">
        {chapters.length === 0 ? (
          <p className="px-4 py-4 text-xs text-muted">Daftar chapter belum tersedia.</p>
        ) : (
          chapters.map((chapter) => (
            <Link
              key={chapter.id}
              href={mangaReaderHref(manga.source, chapter.id)}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface-soft focus-visible:bg-surface-soft"
            >
              <span className="min-w-0 flex-1 truncate text-foreground">{chapter.title}</span>
              <span className="shrink-0 text-right text-xs text-subtle">
                {chapter.releasedAt ? formatDate(chapter.releasedAt) : "—"}
                {typeof chapter.group === "string" && chapter.group ? ` · ${chapter.group}` : ""}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
