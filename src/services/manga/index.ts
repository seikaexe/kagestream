import { SourceError, errorMessage } from "@/lib/errors";
import { uniqueBy } from "@/lib/utils/text";
import type { AggregatedResult, SourceFailure } from "@/types/common";
import type {
  MangaCatalogParams,
  MangaChapter,
  MangaDetail,
  MangaGenre,
  MangaReader,
  MangaSource,
  MangaSummary
} from "@/types/manga";
import type { Paginated } from "@/types/common";
import { komiku } from "./komiku";
import { mangadex } from "./mangadex";
import { shinigami } from "./shinigami";

function failure(source: string, error: unknown): SourceFailure {
  return { source, message: errorMessage(error) };
}

export async function getMangaCatalog(
  source: MangaSource,
  params: MangaCatalogParams = {}
): Promise<Paginated<MangaSummary>> {
  switch (source) {
    case "shinigami":
      return shinigami.getCatalog(params);
    case "komiku":
      return komiku.getCatalog(params);
    case "mangadex":
      return mangadex.getCatalog(params);
    default:
      throw new SourceError("manga", "Sumber manga tidak dikenal.");
  }
}

export async function getMangaDetail(
  source: MangaSource,
  id: string,
  language = "id"
): Promise<MangaDetail> {
  switch (source) {
    case "shinigami":
      return shinigami.getDetail(id);
    case "komiku":
      return komiku.getDetail(id);
    case "mangadex":
      return mangadex.getDetail(id, language);
    default:
      throw new SourceError("manga", "Sumber manga tidak dikenal.");
  }
}

export async function getMangaReader(
  source: MangaSource,
  chapterId: string
): Promise<MangaReader> {
  switch (source) {
    case "shinigami":
      return shinigami.getReader(chapterId);
    case "komiku":
      return komiku.getReader(chapterId);
    case "mangadex":
      return mangadex.getReader(chapterId);
    default:
      throw new SourceError("manga", "Sumber manga tidak dikenal.");
  }
}

export async function getMangaGenres(source: MangaSource): Promise<MangaGenre[]> {
  switch (source) {
    case "shinigami":
      return shinigami.getGenres();
    case "komiku":
      return komiku.getGenres();
    case "mangadex":
      return mangadex.getGenres();
    default:
      return [];
  }
}

export async function getMangaDetailAnySource(
  source: MangaSource,
  id: string,
  language = "id"
): Promise<MangaDetail> {
  try {
    return await getMangaDetail(source, id, language);
  } catch (error) {
    if (source !== "mangadex") throw error;
    const fallback = await getMangaCatalog("shinigami", { keyword: id });
    if (fallback.items.length > 0) {
      return getMangaDetail("shinigami", fallback.items[0].id);
    }
    throw error;
  }
}

export async function getMangaChapters(source: MangaSource, id: string): Promise<Paginated<MangaChapter>> {
  switch (source) {
    case "shinigami": {
      const detail = await shinigami.getDetail(id);
      return { items: detail.chapters, page: 0, hasMore: false };
    }
    case "komiku": {
      const detail = await komiku.getDetail(id);
      return { items: detail.chapters, page: 0, hasMore: false };
    }
    case "mangadex": {
      const detail = await mangadex.getDetail(id);
      return { items: detail.chapters.slice(0, 300), page: 0, hasMore: false };
    }
    default:
      throw new SourceError("manga", "Sumber manga tidak dikenal.");
  }
}

export async function getMangaSearch(
  keyword: string,
  language = "id",
  limitPerSource = 8
): Promise<AggregatedResult<MangaSummary>> {
  const clean = keyword.trim();
  if (!clean) return { items: [], failures: [] };

  const results = await Promise.allSettled([
    shinigami.search(clean, limitPerSource),
    komiku.getSearch(clean),
    mangadex.search(clean, language, limitPerSource)
  ]);

  const items: MangaSummary[] = [];
  const failures: SourceFailure[] = [];
  const sources = ["Shinigami", "Komiku", "MangaDex"];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      items.push(...result.value.slice(0, limitPerSource));
    } else {
      failures.push(failure(sources[index], result.reason));
    }
  });

  return {
    items: uniqueBy(items, (item) => `${item.source}:${item.id}`),
    failures
  };
}

export async function getMangaLatest(limit = 10): Promise<AggregatedResult<MangaSummary>> {
  const results = await Promise.allSettled([
    shinigami.getCatalog({ page: 0, sort: "latest" }),
    komiku.getCatalog({ page: 0 })
  ]);

  const items: MangaSummary[] = [];
  const failures: SourceFailure[] = [];
  const sources = ["Shinigami", "Komiku"];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      items.push(...result.value.items.slice(0, limit));
    } else {
      failures.push(failure(sources[index], result.reason));
    }
  });

  return {
    items: uniqueBy(items, (item) => `${item.source}:${item.id}`),
    failures
  };
}

export async function getMangaPopular(limit = 10): Promise<AggregatedResult<MangaSummary>> {
  const results = await Promise.allSettled([
    shinigami.getCatalog({ page: 0, sort: "popular" }),
    mangadex.getCatalog({ page: 0, language: "id", sort: "popular" })
  ]);

  const items: MangaSummary[] = [];
  const failures: SourceFailure[] = [];
  const sources = ["Shinigami", "MangaDex"];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      items.push(...result.value.items.slice(0, limit));
    } else {
      failures.push(failure(sources[index], result.reason));
    }
  });

  return {
    items: uniqueBy(items, (item) => `${item.source}:${item.id}`),
    failures
  };
}

export type { MangaSource };
