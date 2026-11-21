"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/states";
import { mangaReaderHref } from "@/lib/routes";
import type { MangaReader } from "@/types/manga";
import type { MangaSource } from "@/services/manga";
import { useSettings } from "@/components/providers/settings-provider";
import { useLibrary } from "@/components/providers/library-provider";

export function MangaReader({ source, reader }: { source: MangaSource; reader: MangaReader }) {
  const { readerMode } = useSettings();
  const paged = readerMode === "paged";
  const [index, setIndex] = useState(0);
  const { addHistory } = useLibrary();

  useEffect(() => {
    const chapter = reader.chapter;
    addHistory({
      key: `chapter:${source}:${reader.mangaId}:${chapter.id}`,
      kind: "manga",
      id: chapter.id,
      title: chapter.title,
      subtitle: source,
      href: mangaReaderHref(source, chapter.id),
      progress: paged ? `Chapter ${chapter.number} — Halaman ${Math.min(index + 1, reader.pages.length || 1)}/${reader.pages.length}` : `Chapter ${chapter.number}`
    });
    // Only seed the history entry when the reader opens, not on every index change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentIndex = paged ? Math.min(Math.max(0, index), reader.pages.length - 1) : index;
  const total = reader.pages.length;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-base font-semibold text-foreground">{reader.chapter.title}</h1>
        <div className="flex items-center gap-2 text-xs text-muted">
          {reader.prev ? <Link href={mangaReaderHref(source, reader.prev.id)}>Chapter sebelumnya</Link> : null}
          {reader.next ? <Link href={mangaReaderHref(source, reader.next.id)}>Chapter berikutnya</Link> : null}
        </div>
      </header>

      {total === 0 ? (
        <EmptyState title="Halaman chapter belum tersedia" description="Chapter ini belum punya gambar dari sumber manga." />
      ) : paged ? (
        <div className="flex items-center justify-between rounded-md border border-border bg-surface-soft/40 px-3 py-2 text-xs text-muted">
          <button type="button" onClick={() => setIndex((i) => Math.max(0, i - 1))} className="text-sm">◀</button>
          <span>Halaman {currentIndex + 1} dari {total}</span>
          <button type="button" onClick={() => setIndex((i) => Math.min(total - 1, i + 1))} className="text-sm">▶</button>
        </div>
      ) : null}

      <main className="flex flex-col items-center gap-3">
        {paged ? (
          <img
            src={reader.pages[currentIndex]}
            alt={`Halaman ${currentIndex + 1}`}
            loading="eager"
            className="max-h-[85vh] w-auto rounded-md border border-border bg-surface-soft/30 object-contain shadow-card"
          />
        ) : (
          reader.pages.map((src, index) => (
            <img
              key={`${index}:${src}`}
              src={src}
              alt={`Halaman ${index + 1}`}
              loading="lazy"
              className="mx-auto w-full max-w-2xl rounded-md border border-border bg-surface-soft/30 object-contain shadow-card"
            />
          ))
        )}
      </main>

    </div>
  );
}
