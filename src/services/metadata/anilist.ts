import { z } from "zod";
import { env } from "@/lib/env";
import { cached } from "@/lib/cache";
import { fetchJson } from "@/lib/http";
import { SourceError } from "@/lib/errors";
import { safeHttpUrl, stripHtml, truncate } from "@/lib/utils/text";
import type { AnimeScheduleDay, AnimeSummary } from "@/types/anime";

const SOURCE = "anilist";

const titleSchema = z.object({
  romaji: z.string(),
  english: z.string().nullish(),
  native: z.string().nullish()
});

const mediaSchema = z.object({
  id: z.number(),
  idMal: z.number().nullish(),
  title: titleSchema,
  description: z.string().nullish(),
  coverImage: z
    .object({
      extraLarge: z.string().nullish(),
      large: z.string().nullish(),
      color: z.string().nullish()
    })
    .nullish(),
  bannerImage: z.string().nullish(),
  genres: z.array(z.string()).default([]),
  averageScore: z.number().nullish(),
  episodes: z.number().nullish(),
  duration: z.number().nullish(),
  status: z.string().nullish(),
  season: z.string().nullish(),
  seasonYear: z.number().nullish(),
  format: z.string().nullish(),
  studios: z
    .object({
      nodes: z.array(z.object({ name: z.string() })).default([])
    })
    .nullish()
});

const pageSchema = z.object({
  pageInfo: z.object({
    total: z.number().default(0),
    currentPage: z.number().default(1),
    lastPage: z.number().default(1),
    hasNextPage: z.boolean().default(false)
  }),
  media: z.array(mediaSchema).default([])
});

const mediaResponseSchema = z.object({
  data: z.object({ Media: mediaSchema.nullable() }).optional(),
  errors: z.array(z.object({ message: z.string() })).optional()
});

const pageResponseSchema = z.object({
  data: z.object({ Page: pageSchema }).optional(),
  errors: z.array(z.object({ message: z.string() })).optional()
});

const scheduleItemSchema = z.object({
  airingAt: z.number(),
  episode: z.number(),
  media: mediaSchema
});

const scheduleResponseSchema = z.object({
  data: z
    .object({
      Page: z.object({
        pageInfo: z.object({ hasNextPage: z.boolean().default(false), currentPage: z.number().default(1) }).default({
          hasNextPage: false,
          currentPage: 1
        }),
        airingSchedules: z.array(scheduleItemSchema).default([])
      })
    })
    .optional(),
  errors: z.array(z.object({ message: z.string() })).optional()
});

export type AniListMedia = z.infer<typeof mediaSchema>;

export interface AniListMetadata {
  id: number;
  idMal?: number;
  title: string;
  altTitle?: string;
  nativeTitle?: string;
  description?: string;
  cover?: string;
  banner?: string;
  genres: string[];
  studio?: string;
  score?: number;
  episodes?: number;
  duration?: number;
  status?: string;
  season?: string;
  seasonYear?: number;
  format?: string;
}

const MEDIA_FIELDS = `
  id
  idMal
  title { romaji english native }
  description(asHtml: false)
  coverImage { extraLarge large color }
  bannerImage
  genres
  averageScore
  episodes
  duration
  status
  season
  seasonYear
  format
  studios(isMain: true) { nodes { name } }
`;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\b(season|part|cour|the|movie|ova|ona)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapStatus(value: string | null | undefined): string {
  switch (value) {
    case "RELEASING":
      return "Ongoing";
    case "FINISHED":
      return "Selesai";
    case "NOT_YET_RELEASED":
      return "Belum tayang";
    case "CANCELLED":
      return "Dibatalkan";
    case "HIATUS":
      return "Hiatus";
    default:
      return value ?? "Tidak diketahui";
  }
}

export function mapAniListMedia(media: AniListMedia): AnimeSummary {
  return {
    id: String(media.id),
    source: "anilist",
    title: media.title.english || media.title.romaji,
    altTitle: media.title.native ?? media.title.romaji,
    synopsis: truncate(stripHtml(media.description), 600),
    poster: safeHttpUrl(media.coverImage?.extraLarge ?? media.coverImage?.large),
    cover: safeHttpUrl(media.bannerImage),
    type: media.format ?? undefined,
    status: mapStatus(media.status),
    year: media.seasonYear ? String(media.seasonYear) : undefined,
    season: media.season ?? undefined,
    genres: media.genres,
    studio: media.studios?.nodes.map((node) => node.name).join(", ") || undefined,
    score: media.averageScore ?? undefined,
    totalEpisodes: media.episodes ?? undefined,
    airedStart: media.seasonYear ? String(media.seasonYear) : undefined
  };
}

function mapMetadata(media: AniListMedia): AniListMetadata {
  return {
    id: media.id,
    idMal: media.idMal ?? undefined,
    title: media.title.english || media.title.romaji,
    altTitle: media.title.romaji,
    nativeTitle: media.title.native ?? undefined,
    description: truncate(stripHtml(media.description), 1200),
    cover: safeHttpUrl(media.coverImage?.extraLarge ?? media.coverImage?.large),
    banner: safeHttpUrl(media.bannerImage),
    genres: media.genres,
    studio: media.studios?.nodes.map((node) => node.name).join(", ") || undefined,
    score: media.averageScore ?? undefined,
    episodes: media.episodes ?? undefined,
    duration: media.duration ?? undefined,
    status: mapStatus(media.status),
    season: media.season ?? undefined,
    seasonYear: media.seasonYear ?? undefined,
    format: media.format ?? undefined
  };
}

async function graphql<S extends z.ZodType>(query: string, variables: Record<string, unknown>, schema: S): Promise<z.infer<S>> {
  const parsed = await fetchJson(
    env.ANILIST_API_URL,
    schema,
    {
      source: SOURCE,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables })
    }
  );
  const withErrors = parsed as { errors?: Array<{ message: string }> };
  if (withErrors.errors?.length) {
    throw new SourceError(SOURCE, withErrors.errors[0]?.message ?? "AniList menolak permintaan.");
  }
  return parsed as z.infer<S>;
}

export async function searchMedia(search: string, perPage = 5): Promise<AnimeSummary[]> {
  const clean = search.trim();
  if (!clean) return [];
  return cached(`anilist:search:${clean}:${perPage}`, env.CACHE_TTL_SECONDS, async () => {
    const result = await graphql(
      `query ($search: String, $perPage: Int) {
        Page(page: 1, perPage: $perPage) {
          pageInfo { total currentPage lastPage hasNextPage }
          media(search: $search, type: ANIME, sort: SEARCH_MATCH) { ${MEDIA_FIELDS} }
        }
      }`,
      { search: clean, perPage },
      pageResponseSchema
    );
    return (result.data?.Page.media ?? []).map(mapAniListMedia);
  });
}

export async function getMediaById(id: number): Promise<AniListMetadata | null> {
  return cached(`anilist:media:${id}`, 60 * 60 * 6, async () => {
    const result = await graphql(
      `query ($id: Int) { Media(id: $id, type: ANIME) { ${MEDIA_FIELDS} } }`,
      { id },
      mediaResponseSchema
    );
    return result.data?.Media ? mapMetadata(result.data.Media) : null;
  });
}

export async function matchAnime(title: string, altTitle?: string): Promise<AniListMetadata | null> {
  const candidates = [title, altTitle].filter((value): value is string => Boolean(value?.trim()));
  const normalized = candidates.map(normalize).filter(Boolean);
  if (normalized.length === 0) return null;

  const results = await searchMedia(title, 8);
  if (results.length === 0) return null;

  let best: AnimeSummary | undefined;
  let bestScore = 0;

  for (const result of results) {
    const names = [result.title, result.altTitle].filter((value): value is string => Boolean(value)).map(normalize);
    let score = 0;
    for (const target of normalized) {
      for (const name of names) {
        if (!name) continue;
        if (name === target) score = Math.max(score, 100);
        else if (name.startsWith(target) || target.startsWith(name)) score = Math.max(score, 80);
        else if (name.includes(target) || target.includes(name)) score = Math.max(score, 55);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = result;
    }
  }

  if (!best || bestScore < 55) return null;
  return getMediaById(Number(best.id));
}

export async function getTrending(page = 0, perPage = 12): Promise<AnimeSummary[]> {
  return cached(`anilist:trending:${page}:${perPage}`, 60 * 30, async () => {
    const result = await graphql(
      `query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage lastPage hasNextPage }
          media(type: ANIME, sort: TRENDING_DESC, isAdult: false) { ${MEDIA_FIELDS} }
        }
      }`,
      { page: page + 1, perPage },
      pageResponseSchema
    );
    return (result.data?.Page.media ?? []).map(mapAniListMedia);
  });
}

export async function getPopular(page = 0, perPage = 12): Promise<AnimeSummary[]> {
  return cached(`anilist:popular:${page}:${perPage}`, 60 * 60, async () => {
    const result = await graphql(
      `query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage lastPage hasNextPage }
          media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) { ${MEDIA_FIELDS} }
        }
      }`,
      { page: page + 1, perPage },
      pageResponseSchema
    );
    return (result.data?.Page.media ?? []).map(mapAniListMedia);
  });
}

export async function getWeeklySchedule(): Promise<AnimeScheduleDay[]> {
  return cached("anilist:weekly-schedule", 60 * 15, async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const result = await graphql(
      `query ($start: Int, $end: Int) {
        Page(page: 1, perPage: 150) {
          pageInfo { total currentPage lastPage hasNextPage }
          airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
            airingAt
            episode
            media { ${MEDIA_FIELDS} }
          }
        }
      }`,
      { start: Math.floor(start.getTime() / 1000), end: Math.floor(end.getTime() / 1000) },
      scheduleResponseSchema
    );

    const groups = new Map<string, AnimeSummary[]>();
    for (const item of result.data?.Page.airingSchedules ?? []) {
      const date = new Date(item.airingAt * 1000);
      const key = new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "short",
        timeZone: "Asia/Jakarta"
      }).format(date);
      const summary = mapAniListMedia(item.media);
      const list = groups.get(key) ?? [];
      if (!list.some((entry) => entry.id === summary.id)) list.push(summary);
      groups.set(key, list);
    }

    return [...groups.entries()].map(([day, items]) => ({ day, items }));
  });
}

export const anilist = {
  searchMedia,
  getMediaById,
  matchAnime,
  getTrending,
  getPopular,
  getWeeklySchedule
};
