"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { WebtoonViewerData, WebtoonSummary } from "@/types/webtoon";
import { useSettings } from "@/components/providers/settings-provider";
import { useLibrary } from "@/components/providers/library-provider";

function readHref(webtoon: WebtoonSummary, episode: number): string {
  return `/webtoon/read/${webtoon.kind}/${encodeURIComponent(webtoon.slug)}/${encodeURIComponent(webtoon.id)}/${episode}`;
}

export function WebtoonViewer({ webtoon, episode, images, prev, next }: WebtoonViewerData) {
  const { readerMode } = useSettings();
  const paged = readerMode === "paged";
  const [index, setIndex] = useState(0);
  const { addHistory } = useLibrary();

  useEffect(() => {
    addHistory({
      key: `chapter:${webtoon.kind}:${webtoon.id}:${episode.no}`,
      kind: "webtoon",
      id: String(episode.no),
      title: `${webtoon.title} · Episode ${episode.no}`,
      subtitle: webtoon.title,
      image: webtoon.cover,
      href: readHref(webtoon, episode.no),
      progress: `Episode ${episode.no}`
    });
    // Seed the history entry once when the viewer opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentIndex = paged ? Math.min(Math.max(0, index), Math.max(0, images.length - 1)) : index;
  const currentImage = images[currentIndex];

  const prevHref = prev ? readHref(webtoon, prev.no) : null;
  const nextHref = next ? readHref(webtoon, next.no) : null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <header className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
        <div>
          <h1 className="text-base font-semibold text-foreground">{episode.title}</h1>
          <p className="text-sm text-muted">{webtoon.title}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          {prevHref ? <Link href={prevHref}>Episode sebelumnya</Link> : null}
          {nextHref ? <Link href={nextHref}>Episode berikutnya</Link> : null}
        </div>
      </header>

      {images.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-xs text-muted">
          Gambar episode tidak tersedia.
        </div>
      ) : paged ? (
        <div className="flex flex-col items-center gap-3">
          <img
            src={currentImage}
            alt={`Episode ${episode.no} - halaman ${currentIndex + 1}`}
            loading="eager"
            className="w-full max-h-[85vh] rounded-md border border-border bg-surface-soft/30 object-contain shadow-card"
          />
          <div className="flex items-center justify-between gap-4">
            <button type="button" disabled={currentIndex === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))} className="text-xs text-muted">
              Sebelumnya
            </button>
            <span className="text-xs text-muted">Halaman {currentIndex + 1} dari {images.length}</span>
            <button
              type="button"
              disabled={currentIndex === images.length - 1}
              onClick={() => setIndex((i) => Math.min(images.length - 1, i + 1))}
              className="text-xs text-muted"
            >
              Berikutnya
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {images.map((src, imageIndex) => (
            <img
              key={`${imageIndex}:${src}`}
              src={src}
              alt={`Episode ${episode.no} - halaman ${imageIndex + 1}`}
              loading="lazy"
              className="mx-auto w-full rounded-sm border border-border bg-surface-soft/30 object-contain shadow-card"
            />
          ))}
        </div>
      )}
    </div>
  );
}
