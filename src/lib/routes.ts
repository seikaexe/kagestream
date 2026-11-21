import type { MangaSource } from "@/types/manga";
import type { WebtoonKind, WebtoonSummary } from "@/types/webtoon";

export function animeHref(id: string): string {
  return `/anime/${encodeURIComponent(id)}`;
}

export function animeWatchHref(animeId: string, episodeId: string): string {
  return `/anime/${encodeURIComponent(animeId)}/watch/${encodeURIComponent(episodeId)}`;
}

export function mangaHref(source: MangaSource, id: string): string {
  return `/manga/${source}/${encodeURIComponent(id)}`;
}

export function mangaReaderHref(source: MangaSource, chapterId: string): string {
  return `/manga/${source}/read/${encodeURIComponent(chapterId)}`;
}

export function webtoonHref(item: Pick<WebtoonSummary, "id" | "kind" | "genre" | "slug">): string {
  if (item.kind === "canvas") {
    return `/webtoon/canvas/${encodeURIComponent(item.slug)}/${encodeURIComponent(item.id)}`;
  }
  return `/webtoon/original/${encodeURIComponent(item.genre)}/${encodeURIComponent(item.slug)}/${encodeURIComponent(item.id)}`;
}

export function webtoonReaderHref(
  item: Pick<WebtoonSummary, "id" | "kind" | "genre" | "slug">,
  episode: number
): string {
  if (item.kind === "canvas") {
    return `/webtoon/read/canvas/${encodeURIComponent(item.slug)}/${encodeURIComponent(item.id)}/${episode}`;
  }
  return `/webtoon/read/original/${encodeURIComponent(item.genre)}/${encodeURIComponent(item.slug)}/${encodeURIComponent(item.id)}/${episode}`;
}

export interface WebtoonRoute {
  kind: WebtoonKind;
  genre?: string;
  slug: string;
  id: string;
  episode?: number;
}

function clean(value: string | undefined): string {
  return decodeURIComponent(value ?? "").replace(/\//g, "");
}

function stripLeadingKind(kind: string, segments: string[]): string[] {
  return segments[0] === kind ? segments.slice(1) : segments;
}

export function parseWebtoonDetailSegments(kind: WebtoonKind, segments: string[]): WebtoonRoute | null {
  const base = stripLeadingKind(kind, segments);
  if (base.length < 2) return null;
  const id = clean(base[base.length - 1]);
  const slug = clean(base[base.length - 2]);
  const genre =
    kind === "canvas" ? "canvas" : base.length >= 3 ? clean(base[0]) : undefined;
  if (!id || !slug || !genre) return null;
  return { kind, id, slug, genre };
}

export function parseWebtoonReadSegments(kind: WebtoonKind, segments: string[]): WebtoonRoute | null {
  const base = stripLeadingKind(kind, segments);
  if (base.length < 3) return null;
  const episode = Number(clean(base[base.length - 1]));
  if (!Number.isFinite(episode) || episode <= 0) return null;
  const id = clean(base[base.length - 2]);
  const slug = clean(base[base.length - 3]);
  const genre = kind === "canvas" ? "canvas" : clean(base[0]);
  if (!id || !slug || !genre) return null;
  return { kind, id, slug, episode, genre };
}

