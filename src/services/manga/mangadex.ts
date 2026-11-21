import { z } from "zod";
import { env } from "@/lib/env";
import { cached } from "@/lib/cache";
import { fetchJson } from "@/lib/http";
import { SourceError } from "@/lib/errors";
import { safeHttpUrl, stripHtml, toNumber, truncate } from "@/lib/utils/text";
import type {
  MangaCatalogParams,
  MangaChapter,
  MangaDetail,
  MangaGenre,
  MangaReader,
  MangaSummary
} from "@/types/manga";
import type { Paginated } from "@/types/common";

const SOURCE = "mangadex";

const relationshipSchema = z.object({
  id: z.string(),
  type: z.string(),
  attributes: z.record(z.string(), z.unknown()).nullish()
});

const mangaSchema = z.object({
  id: z.string(),
  type: z.literal("manga"),
  attributes: z.object({
    title: z.record(z.string(), z.string()),
    altTitles: z.array(z.record(z.string(), z.string())).default([]),
    description: z.record(z.string(), z.string()).default({}),
    status: z.string().nullish(),
    year: z.number().nullish(),
    contentRating: z.string().nullish(),
    tags: z
      .array(
        z.object({
          id: z.string(),
          attributes: z.object({
            name: z.record(z.string(), z.string()),
            group: z.string()
          })
        })
      )
      .default([]),
    availableTranslatedLanguages: z.array(z.string()).default([]),
    latestUploadedChapter: z.string().nullish(),
    originalLanguage: z.string().nullish()
  }),
  relationships: z.array(relationshipSchema).default([])
});

const mangaListSchema = z.object({
  result: z.string(),
  data: z.array(mangaSchema).default([]),
  limit: z.number().default(10),
  offset: z.number().default(0),
  total: z.number().default(0)
});

const mangaResponseSchema = z.object({
  result: z.string(),
  data: mangaSchema
});

const chapterSchema = z.object({
  id: z.string(),
  type: z.literal("chapter"),
  attributes: z.object({
    volume: z.string().nullish(),
    chapter: z.string().nullish(),
    title: z.string().nullish(),
    translatedLanguage: z.string(),
    externalUrl: z.string().nullish(),
    publishAt: z.string().nullish(),
    readableAt: z.string().nullish(),
    pages: z.number().default(0)
  }),
  relationships: z.array(relationshipSchema).default([])
});

const chapterListSchema = z.object({
  result: z.string(),
  data: z.array(chapterSchema).default([]),
  limit: z.number().default(100),
  offset: z.number().default(0),
  total: z.number().default(0)
});

const chapterResponseSchema = z.object({
  result: z.string(),
  data: chapterSchema
});

const atHomeSchema = z.object({
  result: z.string(),
  baseUrl: z.string(),
  chapter: z.object({
    hash: z.string(),
    data: z.array(z.string()).default([]),
    dataSaver: z.array(z.string()).default([])
  })
});

const tagsSchema = z.object({
  result: z.string(),
  data: z.array(
    z.object({
      id: z.string(),
      type: z.literal("tag"),
      attributes: z.object({
        name: z.record(z.string(), z.string()),
        group: z.string()
      })
    })
  )
});

const LANGUAGE_LABELS: Record<string, string> = {
  id: "Indonesia",
  en: "English",
  ja: "日本語"
};

function api(path: string): string {
  return `${env.MANGADEX_API_URL.replace(/\/$/, "")}${path}`;
}

function pickTranslation(record: Record<string, string>, preferred: string[]): string | undefined {
  for (const language of preferred) {
    if (record[language]) return record[language];
  }
  return Object.values(record)[0];
}

function coverUrl(mangaId: string, relationships: z.infer<typeof relationshipSchema>[]): string | undefined {
  const cover = relationships.find((relationship) => relationship.type === "cover_art");
  const fileName = cover?.attributes?.fileName;
  if (typeof fileName !== "string") return undefined;
  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}.512.jpg`;
}

function mapManga(item: z.infer<typeof mangaSchema>): MangaSummary {
  const attrs = item.attributes;
  const title =
    pickTranslation(attrs.title, ["id", "en", "ja", "romaji"]) ?? "Tanpa judul";
  const altTitle = attrs.altTitles
    .map((entry) => pickTranslation(entry, ["id", "en", "ja", "romaji"]))
    .filter((value): value is string => Boolean(value))
    .find((value) => value !== title);
  const author = item.relationships.find((rel) => rel.type === "author")?.attributes?.name;
  const artist = item.relationships.find((rel) => rel.type === "artist")?.attributes?.name;

  return {
    id: item.id,
    source: "mangadex",
    title,
    altTitle,
    description: truncate(stripHtml(pickTranslation(attrs.description, ["id", "en", "ja"])), 900),
    cover: safeHttpUrl(coverUrl(item.id, item.relationships)),
    genres: attrs.tags.map((tag) => tag.attributes.name.en ?? Object.values(tag.attributes.name)[0] ?? "").filter(Boolean),
    status: attrs.status ?? undefined,
    year: attrs.year ? String(attrs.year) : undefined,
    author: typeof author === "string" ? author : undefined,
    artist: typeof artist === "string" ? artist : undefined,
    language: attrs.availableTranslatedLanguages[0] ?? undefined,
    kind: attrs.originalLanguage ? attrs.originalLanguage.toUpperCase() : undefined,
    latestChapter: attrs.latestUploadedChapter ? "Chapter terbaru" : undefined
  };
}

function mapChapter(item: z.infer<typeof chapterSchema>, mangaId = ""): MangaChapter {
  const attrs = item.attributes;
  const number = attrs.chapter ? toNumber(attrs.chapter, 0) : 0;
  const group = item.relationships.find((rel) => rel.type === "scanlation_group")?.attributes?.name;
  return {
    id: item.id,
    mangaId,
    number,
    title: attrs.title?.trim() || `Chapter ${attrs.chapter ?? number}`,
    releasedAt: attrs.readableAt ?? attrs.publishAt ?? undefined,
    group: typeof group === "string" ? group : undefined,
    language: attrs.translatedLanguage,
    pages: attrs.pages
  };
}

export async function getCatalog(params: MangaCatalogParams = {}): Promise<Paginated<MangaSummary>> {
  const page = Math.max(0, params.page ?? 0);
  const limit = 24;
  const language = params.language ?? "id";
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(page * limit),
    "order[latestUploadedChapter]": "desc",
    "contentRating[]": "safe",
    hasAvailableChapters: "true"
  });
  query.append("contentRating[]", "suggestive");
  query.append("includes[]", "cover_art");
  query.append("includes[]", "author");
  query.append("includes[]", "artist");
  query.append("availableTranslatedLanguage[]", language);
  if (params.keyword?.trim()) query.set("title", params.keyword.trim());
  if (params.genre?.trim()) query.append("includedTags[]", params.genre.trim());

  const key = `mangadex:catalog:${page}:${language}:${params.keyword ?? ""}:${params.genre ?? ""}`;

  return cached(key, env.CACHE_TTL_SECONDS, async () => {
    const parsed = await fetchJson(api(`/manga?${query.toString()}`), mangaListSchema, { source: SOURCE });
    return {
      items: parsed.data.map(mapManga),
      page,
      hasMore: parsed.offset + parsed.data.length < parsed.total,
      total: parsed.total
    };
  });
}

export async function search(keyword: string, language = "id", limit = 12): Promise<MangaSummary[]> {
  const clean = keyword.trim();
  if (!clean) return [];
  return cached(`mangadex:search:${clean}:${language}:${limit}`, env.CACHE_TTL_SECONDS, async () => {
    const query = new URLSearchParams({ title: clean, limit: String(limit) });
    query.append("includes[]", "cover_art");
    query.append("includes[]", "author");
    query.append("includes[]", "artist");
    query.append("contentRating[]", "safe");
    query.append("contentRating[]", "suggestive");
    query.append("availableTranslatedLanguage[]", language);
    const parsed = await fetchJson(api(`/manga?${query.toString()}`), mangaListSchema, { source: SOURCE });
    return parsed.data.map(mapManga);
  });
}

export async function getDetail(id: string, language = "id"): Promise<MangaDetail> {
  return cached(`mangadex:detail:${id}:${language}`, env.CACHE_TTL_SECONDS, async () => {
    const [detail, chapters] = await Promise.all([
      fetchJson(
        api(`/manga/${encodeURIComponent(id)}?includes[]=cover_art&includes[]=author&includes[]=artist`),
        mangaResponseSchema,
        { source: SOURCE }
      ),
      getChapters(id, language)
    ]);

    const summary = mapManga(detail.data);
    return {
      ...summary,
      chapters: chapters.items,
      availableLanguages: detail.data.attributes.availableTranslatedLanguages,
      externalUrl: `https://mangadex.org/title/${id}`
    };
  });
}

export async function getChapters(id: string, language = "id"): Promise<Paginated<MangaChapter> & { total: number }> {
  const query = new URLSearchParams({
    limit: "100",
    "order[chapter]": "desc",
    "order[volume]": "desc",
    includeFutureUpdates: "0",
    "contentRating[]": "safe"
  });
  query.append("contentRating[]", "suggestive");
  query.append("translatedLanguage[]", language);
  query.append("includes[]", "scanlation_group");

  const parsed = await fetchJson(
    api(`/manga/${encodeURIComponent(id)}/feed?${query.toString()}`),
    chapterListSchema,
    { source: SOURCE }
  );

  return {
    items: parsed.data.map((chapter) => mapChapter(chapter, id)),
    page: 0,
    hasMore: parsed.data.length < parsed.total,
    total: parsed.total
  };
}

export async function getReader(chapterId: string): Promise<MangaReader> {
  return cached(`mangadex:reader:${chapterId}`, env.CACHE_TTL_SECONDS, async () => {
    const chapter = await fetchJson(
      api(`/chapter/${encodeURIComponent(chapterId)}?includes[]=scanlation_group&includes[]=manga`),
      chapterResponseSchema,
      { source: SOURCE }
    );
    const mangaId = chapter.data.relationships.find((rel) => rel.type === "manga")?.id ?? "";
    const atHome = await fetchJson(api(`/at-home/server/${encodeURIComponent(chapterId)}`), atHomeSchema, {
      source: SOURCE
    });

    const base = atHome.baseUrl.replace(/\/$/, "");
    const hash = atHome.chapter.hash;
    const pages = atHome.chapter.data
      .map((file) => safeHttpUrl(`${base}/data/${hash}/${file}`))
      .filter((page): page is string => Boolean(page));

    if (pages.length === 0) {
      throw new SourceError(SOURCE, "Halaman chapter tidak tersedia.", { code: "not_found" });
    }

    return {
      mangaId,
      chapter: mapChapter(chapter.data, mangaId),
      pages,
      prev: null,
      next: null
    };
  });
}

export async function getGenres(): Promise<MangaGenre[]> {
  return cached("mangadex:genres", 60 * 60 * 24, async () => {
    const parsed = await fetchJson(api("/manga/tag"), tagsSchema, { source: SOURCE });
    return parsed.data
      .filter((tag) => tag.attributes.group === "genre")
      .map((tag) => ({
        id: tag.id,
        name: tag.attributes.name.en ?? Object.values(tag.attributes.name)[0] ?? tag.id
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });
}

export async function getLanguageLabel(code: string): Promise<string> {
  return LANGUAGE_LABELS[code] ?? code.toUpperCase();
}

export const mangadex = {
  getCatalog,
  search,
  getDetail,
  getChapters,
  getReader,
  getGenres
};
