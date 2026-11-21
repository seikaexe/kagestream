import { errorMessage } from "@/lib/errors";
import type { SourceFailure } from "@/types/common";
import type { MangaSummary } from "@/types/manga";
import type { WebtoonSummary } from "@/types/webtoon";
import { getAnimeHome, type AnimeHomeData } from "./anime";
import { getMangaLatest } from "./manga";
import { webtoon } from "./webtoon/webtoon";

export interface HomeData {
  anime: AnimeHomeData;
  manga: MangaSummary[];
  webtoons: WebtoonSummary[];
  failures: SourceFailure[];
}

export async function getHomeData(): Promise<HomeData> {
  const [animeResult, mangaResult, webtoonResult] = await Promise.allSettled([
    getAnimeHome(),
    getMangaLatest(10),
    webtoon.getOriginals({ page: 0 })
  ]);

  const failures: SourceFailure[] = [];

  let anime: AnimeHomeData = { hero: [], sections: [], genres: [], failures: [] };
  if (animeResult.status === "fulfilled") {
    anime = animeResult.value;
    failures.push(...anime.failures);
  } else {
    failures.push({ source: "Anime", message: errorMessage(animeResult.reason) });
  }

  let manga: MangaSummary[] = [];
  if (mangaResult.status === "fulfilled") {
    manga = mangaResult.value.items;
    failures.push(...mangaResult.value.failures);
  } else {
    failures.push({ source: "Manga", message: errorMessage(mangaResult.reason) });
  }

  let webtoons: WebtoonSummary[] = [];
  if (webtoonResult.status === "fulfilled") {
    webtoons = webtoonResult.value.items;
  } else {
    failures.push({ source: "WEBTOON", message: errorMessage(webtoonResult.reason) });
  }

  return { anime, manga, webtoons, failures };
}
