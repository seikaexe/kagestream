import { SourceError, errorMessage } from "@/lib/errors";
import { uniqueBy } from "@/lib/utils/text";
import type { AggregatedResult, SourceFailure } from "@/types/common";
import type {
  AnimeCatalogParams,
  AnimeDetail,
  AnimeEpisode,
  AnimeGenre,
  AnimeScheduleDay,
  AnimeStream,
  AnimeSummary,
  SkipTime
} from "@/types/anime";
import type { Paginated } from "@/types/common";
import { animein } from "./animein";
import { anilist } from "../metadata/anilist";
import { aniskip } from "../metadata/aniskip";

export interface AnimeHomeSection {
  id: string;
  title: string;
  subtitle?: string;
  href?: string;
  items: AnimeSummary[];
}

export interface AnimeHomeData {
  hero: AnimeSummary[];
  sections: AnimeHomeSection[];
  genres: AnimeGenre[];
  failures: SourceFailure[];
}

function failure(source: string, error: unknown): SourceFailure {
  return { source, message: errorMessage(error) };
}

export async function getAnimeHome(): Promise<AnimeHomeData> {
  const failures: SourceFailure[] = [];
  let home: Awaited<ReturnType<typeof animein.getHome>> | null = null;

  try {
    home = await animein.getHome();
  } catch (error) {
    failures.push(failure("Animein", error));
  }

  const sections: AnimeHomeSection[] = [];

  if (home) {
    if (home.hot.length > 0) {
      sections.push({
        id: "hot",
        title: "Sedang populer",
        subtitle: "Paling banyak ditonton saat ini",
        href: "/anime?sort=views",
        items: home.hot
      });
    }
    if (home.new.length > 0) {
      sections.push({
        id: "new",
        title: "Baru ditambahkan",
        subtitle: "Rilisan terbaru dari sumber",
        href: "/anime?sort=newest",
        items: home.new
      });
    }
    if (home.today.length > 0) {
      sections.push({
        id: "today",
        title: "Jadwal hari ini",
        subtitle: "Episode yang tayang hari ini",
        href: "/anime/schedule",
        items: home.today
      });
    }
    if (home.popular.length > 0) {
      sections.push({
        id: "popular",
        title: "Sepanjang masa",
        subtitle: "Judul dengan penonton terbanyak",
        href: "/anime?sort=favorites",
        items: home.popular
      });
    }
  }

  if (sections.length === 0) {
    try {
      const [trending, popular] = await Promise.all([anilist.getTrending(0, 18), anilist.getPopular(0, 18)]);
      if (trending.length > 0) {
        sections.push({
          id: "trending",
          title: "Sedang tren",
          subtitle: "Peringkat AniList saat ini",
          href: "/anime",
          items: trending
        });
      }
      if (popular.length > 0) {
        sections.push({
          id: "popular",
          title: "Sepanjang masa",
          subtitle: "Judul paling populer di AniList",
          href: "/anime",
          items: popular
        });
      }
    } catch (error) {
      failures.push(failure("AniList", error));
    }
  }

  let genres: AnimeGenre[] = [];
  try {
    genres = await animein.getGenres();
  } catch (error) {
    failures.push(failure("Animein", error));
  }

  const hero = home
    ? uniqueBy([...home.popular, ...home.hot, ...home.new], (item) => item.id).slice(0, 5)
    : (sections[0]?.items.slice(0, 5) ?? []);

  return {
    hero,
    sections: sections.filter((section) => section.items.length > 0),
    genres,
    failures
  };
}

export async function getAnimeCatalog(params: AnimeCatalogParams): Promise<Paginated<AnimeSummary>> {
  return animein.getCatalog(params);
}

export async function getAnimeDetail(id: string): Promise<AnimeDetail> {
  const detail = await animein.getDetail(id);
  let episodes: AnimeEpisode[] = detail.episodes;

  try {
    const list = await animein.getEpisodes(id, 0);
    episodes = list.items;
  } catch {
    episodes = detail.episodes;
  }

  episodes = uniqueBy(episodes, (episode) => episode.id).sort((a, b) => a.number - b.number);

  let enriched = detail;
  try {
    const metadata = await anilist.matchAnime(detail.title, detail.altTitle);
    if (metadata) {
      enriched = {
        ...detail,
        synopsis: detail.synopsis || metadata.description,
        poster: detail.poster ?? metadata.cover,
        cover: detail.cover ?? metadata.banner,
        genres: detail.genres.length > 0 ? detail.genres : metadata.genres,
        studio: detail.studio ?? metadata.studio,
        score: detail.score ?? metadata.score,
        totalEpisodes: detail.totalEpisodes ?? metadata.episodes,
        season: detail.season ?? metadata.season,
        anilistId: metadata.id,
        malId: metadata.idMal,
        banner: metadata.banner
      };
    }
  } catch {
    // Metadata enrichment is optional; the Animein record stays usable.
  }

  return { ...enriched, episodes };
}

export interface AnimeWatchData {
  episode: AnimeEpisode;
  stream: AnimeStream;
  anime: AnimeDetail;
  nextEpisode?: AnimeEpisode | null;
  skipTimes: SkipTime[];
  malId?: number;
}

export async function getAnimeWatch(episodeId: string): Promise<AnimeWatchData> {
  const stream = await animein.getStream(episodeId);
  const anime = await getAnimeDetail(stream.episode.animeId);

  let malId = anime.malId;
  if (!malId) {
    try {
      const metadata = await anilist.matchAnime(anime.title, anime.altTitle);
      malId = metadata?.idMal;
    } catch {
      malId = undefined;
    }
  }

  let skipTimes: SkipTime[] = [];
  if (malId) {
    try {
      skipTimes = await aniskip.getSkipTimes(malId, stream.episode.number);
    } catch {
      skipTimes = [];
    }
  }

  return {
    episode: stream.episode,
    stream,
    anime: { ...anime, malId },
    nextEpisode: stream.nextEpisode,
    skipTimes,
    malId
  };
}

export async function getAnimeSchedule(): Promise<AnimeScheduleDay[]> {
  try {
    const schedule = await animein.getSchedule();
    if (schedule.length > 0) {
      return schedule.map((group) => ({ day: group.day, items: group.items }));
    }
  } catch {
    // Fall through to AniList.
  }
  return anilist.getWeeklySchedule();
}

export async function getAnimeGenres(): Promise<AnimeGenre[]> {
  return animein.getGenres();
}

export async function getAnimeSearch(keyword: string): Promise<AggregatedResult<AnimeSummary>> {
  const clean = keyword.trim();
  if (!clean) return { items: [], failures: [] };

  const results = await Promise.allSettled([
    animein.getCatalog({ keyword: clean, page: 0 }),
    anilist.searchMedia(clean, 8)
  ]);

  const items: AnimeSummary[] = [];
  const failures: SourceFailure[] = [];

  if (results[0].status === "fulfilled") items.push(...results[0].value.items);
  else failures.push(failure("Animein", results[0].reason));

  if (results[1].status === "fulfilled") items.push(...results[1].value);
  else failures.push(failure("AniList", results[1].reason));

  return {
    items: uniqueBy(items, (item) => `${item.source}:${item.id}`),
    failures
  };
}

export async function getAnimeTrending(limit = 12): Promise<AnimeSummary[]> {
  try {
    const [catalog, trend] = await Promise.all([animein.getCatalog({ sort: "views" }), anilist.getTrending(0, limit)]);
    if (catalog.items.length > 0) return catalog.items.slice(0, limit);
    return trend;
  } catch {
    return [];
  }
}

export function animeHref(item: AnimeSummary): string {
  return `/anime/${item.id}`;
}

export { SourceError };
