import { z } from "zod";
import { env } from "@/lib/env";
import { cached } from "@/lib/cache";
import { fetchJson } from "@/lib/http";
import { SourceError } from "@/lib/errors";
import { safeHttpUrl, stripHtml, toNumber, truncate, uniqueBy } from "@/lib/utils/text";
import type {
  AnimeCatalogParams,
  AnimeDetail,
  AnimeEpisode,
  AnimeGenre,
  AnimeStream,
  AnimeSummary,
  StreamServer
} from "@/types/anime";
import type { Paginated } from "@/types/common";

const SOURCE = "animein";
const PAGE_SIZE = 60;

const numberLike = z.union([z.string(), z.number()]).nullish();

const movieSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((value) => String(value)),
  title: z.string(),
  synopsis: z.string().nullish(),
  synonyms: z.string().nullish(),
  image_poster: z.string().nullish(),
  image_cover: z.string().nullish(),
  type: z.string().nullish(),
  year: z.string().nullish(),
  day: z.string().nullish(),
  status: z.string().nullish(),
  views: numberLike,
  favorites: numberLike,
  aired_start: z.string().nullish(),
  genre: z.string().nullish(),
  is_fav: z.union([z.string(), z.number()]).nullish()
});

const sliderSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  image: z.string(),
  type: z.string().nullish(),
  link: z.string().nullish()
});

const homeDataSchema = z.object({
  hot: z.array(movieSchema).default([]),
  new: z.array(movieSchema).default([]),
  today: z.array(movieSchema).default([]),
  popular: z.array(movieSchema).default([]),
  random: z.array(movieSchema).default([]),
  waiting: z.array(movieSchema).default([]),
  slider: z.array(sliderSchema).default([]),
  trailer: z.array(z.unknown()).default([])
});

const episodeSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  index: z.union([z.string(), z.number()]).transform(String),
  title: z.string().nullish(),
  views: numberLike,
  id_movie: z.union([z.string(), z.number()]).transform(String),
  key_time: z.string().nullish(),
  image: z.string().nullish(),
  is_new: z.union([z.string(), z.number()]).nullish()
});

const detailDataSchema = z.object({
  movie: movieSchema,
  episode: episodeSchema.nullish(),
  season: z.array(z.unknown()).default([])
});

const episodeListSchema = z.object({
  episode: z.array(episodeSchema).default([])
});

const streamSchema = z.object({
  episode: episodeSchema,
  episode_next: episodeSchema.nullish(),
  server: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]).transform(String),
        link: z.string(),
        quality: z.string().default("Auto"),
        name: z.string().default("Server"),
        type: z.string().default("unknown"),
        server_id: z.union([z.string(), z.number()]).nullish()
      })
    )
    .default([])
});

const genreSchema = z.object({
  genre: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]).transform(String),
        name: z.string(),
        group: z.string().default("Genre"),
        image: z.string().nullish()
      })
    )
    .default([])
});

const scheduleSchema = z.object({
  movie: z
    .array(
      z.object({
        day: z.string().nullish(),
        movie: z.array(movieSchema).default([])
      })
    )
    .default([])
});

function envelope<T extends z.ZodType>(data: T) {
  return z.object({
    status: z.number(),
    error: z.boolean(),
    data
  });
}

function endpoint(path: string): string {
  return `${env.ANIMEIN_API_BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function requestOptions() {
  return {
    source: SOURCE,
    headers: { "x-proxy-secret": env.ANIMEIN_API_SECRET, Referer: "https://animeinweb.com/" }
  };
}

function mapStatus(value: string | null | undefined): string {
  const normalized = (value ?? "").toUpperCase();
  if (normalized === "ONGOING" || normalized === "AIRING") return "Ongoing";
  if (normalized === "FINISHED" || normalized === "COMPLETED") return "Selesai";
  if (normalized === "WAITING" || normalized === "UPCOMING") return "Belum tayang";
  return value ? value.charAt(0) + value.slice(1).toLowerCase() : "Tidak diketahui";
}

export function mapAnimeinSummary(input: z.infer<typeof movieSchema>): AnimeSummary {
  return {
    id: input.id,
    source: "animein",
    title: input.title,
    altTitle: input.synonyms ?? undefined,
    synopsis: truncate(stripHtml(input.synopsis), 600),
    poster: safeHttpUrl(input.image_poster),
    cover: safeHttpUrl(input.image_cover),
    type: input.type ?? undefined,
    status: mapStatus(input.status),
    year: input.year && input.year !== "UNKNOWN" ? input.year : undefined,
    genres: (input.genre ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    views: toNumber(input.views, 0),
    favorites: toNumber(input.favorites, 0),
    day: input.day ?? undefined,
    airedStart: input.aired_start ?? undefined
  };
}

function mapEpisode(input: z.infer<typeof episodeSchema>): AnimeEpisode {
  return {
    id: input.id,
    animeId: input.id_movie,
    number: toNumber(input.index, 0),
    title: input.title || `Episode ${toNumber(input.index, 0)}`,
    views: toNumber(input.views, 0),
    thumbnail: safeHttpUrl(input.image),
    releasedAt: input.key_time ?? undefined
  };
}

export interface AnimeinHome {
  hot: AnimeSummary[];
  new: AnimeSummary[];
  today: AnimeSummary[];
  popular: AnimeSummary[];
  random: AnimeSummary[];
  waiting: AnimeSummary[];
  sliders: Array<{ id: string; image: string; type?: string; link?: string }>;
}

export async function getHome(): Promise<AnimeinHome> {
  return cached("animein:home", env.CACHE_TTL_SECONDS, async () => {
    const parsed = await fetchJson(endpoint("3/2/home/data"), envelope(homeDataSchema), requestOptions());
    if (parsed.error) throw new SourceError(SOURCE, "Animein mengembalikan respons error.");
    const data = parsed.data;
    const map = (items: z.infer<typeof movieSchema>[]) => uniqueBy(items.map(mapAnimeinSummary), (item) => item.id);
    return {
      hot: map(data.hot),
      new: map(data.new),
      today: map(data.today),
      popular: map(data.popular),
      random: map(data.random),
      waiting: map(data.waiting),
      sliders: data.slider.map((slider) => ({
        id: slider.id,
        image: slider.image,
        type: slider.type ?? undefined,
        link: safeHttpUrl(slider.link)
      }))
    };
  });
}

export async function getCatalog(params: AnimeCatalogParams = {}): Promise<Paginated<AnimeSummary>> {
  const page = Math.max(0, params.page ?? 0);
  const sort = params.sort ?? "views";
  const keyword = (params.keyword ?? (params as { q?: string }).q ?? "").trim();
  const genre = (params.genre ?? "").trim();
  const key = `animein:catalog:${page}:${sort}:${keyword}:${genre}`;

  const result = await cached(key, env.CACHE_TTL_SECONDS, async () => {
    const query = new URLSearchParams({ page: String(page), sort, keyword });
    if (genre) query.set("genre_in", genre);
    const parsed = await fetchJson(endpoint(`3/2/explore/movie?${query.toString()}`), envelope(z.object({ movie: z.array(movieSchema).default([]) })), requestOptions());
    if (parsed.error) throw new SourceError(SOURCE, "Animein mengembalikan respons error.");
    return parsed.data.movie.map(mapAnimeinSummary);
  });

  return {
    items: result,
    page,
    hasMore: result.length >= PAGE_SIZE
  };
}

export async function getDetail(id: string): Promise<AnimeDetail> {
  return cached(`animein:detail:${id}`, env.CACHE_TTL_SECONDS, async () => {
    const parsed = await fetchJson(endpoint(`3/2/movie/detail/${encodeURIComponent(id)}`), envelope(detailDataSchema), requestOptions());
    if (parsed.error) throw new SourceError(SOURCE, "Animein tidak menemukan anime tersebut.");
    const movie = mapAnimeinSummary(parsed.data.movie);
    const first = parsed.data.episode ? [mapEpisode(parsed.data.episode)] : [];
    return {
      ...movie,
      synonyms: parsed.data.movie.synonyms ?? undefined,
      episodes: first
    };
  });
}

export async function getEpisodes(id: string, page = 0): Promise<Paginated<AnimeEpisode>> {
  return cached(`animein:episodes:${id}:${page}`, env.CACHE_TTL_SECONDS, async () => {
    const parsed = await fetchJson(
      endpoint(`3/2/movie/episode/${encodeURIComponent(id)}?page=${page}`),
      envelope(episodeListSchema),
      requestOptions()
    );
    if (parsed.error) throw new SourceError(SOURCE, "Daftar episode tidak tersedia.");
    const episodes = parsed.data.episode.map(mapEpisode);
    return { items: episodes, page, hasMore: episodes.length >= 30 };
  });
}

export async function getStream(episodeId: string): Promise<AnimeStream> {
  return cached(`animein:stream:${episodeId}`, Math.min(env.CACHE_TTL_SECONDS, 120), async () => {
    const parsed = await fetchJson(
      endpoint(`3/2/episode/streamnew/${encodeURIComponent(episodeId)}`),
      envelope(streamSchema),
      requestOptions()
    );
    if (parsed.error) throw new SourceError(SOURCE, "Sumber pemutaran tidak tersedia.");

    const servers: StreamServer[] = parsed.data.server
      .map((server) => ({
        id: server.id,
        name: server.name,
        quality: server.quality || "Auto",
        type:
          server.type === "direct" ? ("direct" as const) : server.type === "semi" ? ("semi" as const) : ("embed" as const),
        url: safeHttpUrl(server.link) ?? "",
        serverId: server.server_id !== null && server.server_id !== undefined ? String(server.server_id) : undefined
      }))
      .filter((server) => server.url.length > 0);

    return {
      episode: mapEpisode(parsed.data.episode),
      nextEpisode: parsed.data.episode_next ? mapEpisode(parsed.data.episode_next) : null,
      servers,
      episodes: []
    };
  });
}

export async function getGenres(): Promise<AnimeGenre[]> {
  return cached("animein:genres", 60 * 60 * 12, async () => {
    const parsed = await fetchJson(endpoint("3/2/explore/genre"), envelope(genreSchema), requestOptions());
    if (parsed.error) return [];
    return parsed.data.genre
      .map((genre) => ({
        id: genre.id,
        name: genre.name,
        group: genre.group,
        image: safeHttpUrl(genre.image)
      }))
      .filter((genre) => Boolean(genre.name));
  });
}

export async function getSchedule(): Promise<Array<{ day: string; items: AnimeSummary[] }>> {
  return cached("animein:schedule", 60 * 10, async () => {
    const parsed = await fetchJson(endpoint("3/2/schedule/data"), envelope(scheduleSchema), requestOptions());
    if (parsed.error) return [];
    return parsed.data.movie
      .map((group) => ({
        day: group.day ?? "Lainnya",
        items: group.movie.map(mapAnimeinSummary)
      }))
      .filter((group) => group.items.length > 0);
  });
}

export const animein = {
  getHome,
  getCatalog,
  getDetail,
  getEpisodes,
  getStream,
  getGenres,
  getSchedule
};
