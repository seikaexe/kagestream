import { errorMessage } from "@/lib/errors";
import type { SourceFailure } from "@/types/common";
import type { AnimeSummary } from "@/types/anime";
import type { MangaSummary } from "@/types/manga";
import type { WebtoonSummary } from "@/types/webtoon";
import { getAnimeSearch } from "./anime";
import { getMangaSearch } from "./manga";
import { webtoon } from "./webtoon/webtoon";

export interface GlobalSearchResult {
  query: string;
  anime: AnimeSummary[];
  manga: MangaSummary[];
  webtoons: WebtoonSummary[];
  failures: SourceFailure[];
}

export async function globalSearch(query: string): Promise<GlobalSearchResult> {
  const clean = query.trim();
  if (clean.length < 2) {
    return { query: clean, anime: [], manga: [], webtoons: [], failures: [] };
  }

  const [anime, manga, webtoons] = await Promise.allSettled([
    getAnimeSearch(clean),
    getMangaSearch(clean),
    webtoon.search(clean)
  ]);

  const failures: SourceFailure[] = [];
  const result: GlobalSearchResult = { query: clean, anime: [], manga: [], webtoons: [], failures };

  if (anime.status === "fulfilled") {
    result.anime = anime.value.items.slice(0, 12);
    failures.push(...anime.value.failures);
  } else {
    failures.push({ source: "Anime", message: errorMessage(anime.reason) });
  }

  if (manga.status === "fulfilled") {
    result.manga = manga.value.items.slice(0, 12);
    failures.push(...manga.value.failures);
  } else {
    failures.push({ source: "Manga", message: errorMessage(manga.reason) });
  }

  if (webtoons.status === "fulfilled") {
    result.webtoons = webtoons.value.slice(0, 12);
  } else {
    failures.push({ source: "WEBTOON", message: errorMessage(webtoons.reason) });
  }

  return result;
}
