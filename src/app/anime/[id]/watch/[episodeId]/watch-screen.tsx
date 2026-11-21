"use client";

import { useEffect, useRef, useState } from "react";
import { Badge, PageHeader } from "@/components/ui/layout";
import { useLibrary } from "@/components/providers/library-provider";
import { animeWatchHref } from "@/lib/routes";
import type { AnimeWatchData } from "@/services/anime";
import type { SkipTime, StreamServer } from "@/types/anime";

export function WatchScreen({ animeId, data }: { animeId: string; data: AnimeWatchData }) {
  const { isBookmarked, toggleBookmark } = useLibrary();

  const nextEpisode = data.nextEpisode;
  const nextHref = nextEpisode ? animeWatchHref(animeId, nextEpisode.id) : null;

  const handleBookmark = () => {
    toggleBookmark({
      key: `anime:${animeId}:${data.episode.id}`,
      kind: "anime",
      id: data.episode.id,
      title: data.anime.title,
      subtitle: data.episode.title,
      image: data.anime.poster ?? data.anime.cover,
      href: animeWatchHref(animeId, data.episode.id)
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          eyebrow={data.anime.type ?? "Anime"}
          title={data.anime.title}
          description={data.anime.synopsis}
          action={
            nextHref ? (
              <a
                href={nextHref}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-strong px-5 text-sm font-medium text-on-strong transition-opacity hover:opacity-85"
              >
                Episode berikutnya
              </a>
            ) : undefined
          }
        />
        <button
          type="button"
          onClick={handleBookmark}
          aria-label={isBookmarked(`anime:${animeId}:${data.episode.id}`) ? "Batalkan bookmark" : "Bookmark episode"}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-muted transition-colors hover:border-strong hover:text-foreground"
        >
          Bookmark
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {data.anime.genres.slice(0, 6).map((genre) => (
          <Badge key={genre}>{genre}</Badge>
        ))}
        {data.anime.score !== undefined ? <Badge tone="strong">{(data.anime.score / 10).toFixed(1)}</Badge> : null}
      </div>

      <VideoPlayer
        episodeId={data.episode.id}
        servers={data.stream.servers}
        nextHref={nextHref}
        skipTimes={data.skipTimes}
      />
    </div>
  );
}

export function VideoPlayer({
  episodeId,
  servers,
  nextHref,
  skipTimes
}: {
  episodeId: string;
  servers: StreamServer[];
  nextHref: string | null;
  skipTimes: SkipTime[];
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [serverIndex, setServerIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    element.pause();
    element.src = servers[serverIndex]?.url ?? "";
    element.load();
    void element.play().catch(() => undefined);
    setFailed(false);
    void element.play().catch(() => undefined);
  }, [serverIndex, episodeId, servers]);

  if (servers.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted">
        Sumber pemutaran tidak tersedia saat ini. Coba beberapa saat lagi.
      </div>
    );
  }

  const current = servers[serverIndex];

  const seekTo = (time: number) => {
    const element = videoRef.current;
    if (element) element.currentTime = time;
  };

  const handleNextServer = () => {
    setServerIndex((index) => Math.min(servers.length - 1, index + 1));
  };

  const isEmpty = !current?.url;

  return (
    <div className="space-y-3">
      <video
        ref={videoRef}
        controls
        preload="metadata"
        playsInline
        controlsList="play inline loop picture-in-picture"
        onError={() => setFailed(true)}
        className="aspect-video w-full rounded-md bg-black object-contain"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2 text-xs">
          {servers.map((server, index) => (
            <button
              key={server.id}
              type="button"
              onClick={() => setServerIndex(index)}
              aria-pressed={index === serverIndex}
              className={`rounded-full border px-3 py-1 ${
                index === serverIndex
                  ? "border-strong bg-strong text-on-strong"
                  : "border-border bg-surface-soft text-muted hover:text-foreground"
              }`}
            >
              {server.name || "Server"} {server.quality ? `(${server.quality})` : ""}
            </button>
          ))}
        </div>
        {nextHref ? (
          <a
            href={nextHref}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs font-medium text-muted transition-colors hover:border-strong hover:text-foreground"
          >
            Episode berikutnya
          </a>
        ) : null}
      </div>

      {failed ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-soft px-4 py-3 text-sm text-muted">
          <span>Server ini gagal dimuat.</span>
          {serverIndex + 1 < servers.length ? (
            <button
              type="button"
              onClick={handleNextServer}
              className="inline-flex h-8 items-center rounded-md bg-strong px-3 text-xs font-medium text-on-strong transition-opacity hover:opacity-85"
            >
              Coba server berikutnya
            </button>
          ) : null}
        </div>
      ) : null}

      {isEmpty ? (
        <div className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted">
          {current ? "Tidak ada URL pemutaran pada server ini." : "Server ini tidak memberikan URL pemutaran."}
        </div>
      ) : null}

      {skipTimes.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skipTimes.map((skip, index) => (
            <button
              key={index}
              type="button"
              onClick={() => seekTo(skip.endTime)}
              className="inline-flex h-8 items-center rounded-md border border-border bg-surface-soft px-3 text-xs text-muted transition-colors hover:border-strong hover:text-foreground"
            >
              Skip {skip.type === "op" ? "Opening" : skip.type === "ed" ? "Ending" : skip.type}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
