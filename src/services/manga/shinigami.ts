import { z } from "zod";
import { env } from "@/lib/env";
import { cached } from "@/lib/cache";
import { fetchJson } from "@/lib/http";
import { SourceError } from "@/lib/errors";
import { safeHttpUrl, stripHtml, truncate } from "@/lib/utils/text";
import type {
  MangaCatalogParams,
  MangaChapter,
  MangaDetail,
  MangaGenre,
  MangaReader,
  MangaSummary
} from "@/types/manga";
import type { Paginated } from "@/types/common";

const SOURCE = "shinigami";

const taxonomyItemSchema = z.object({
  name: z.string(),
  slug: z.string()
});

const mangaSchema = z.object({
  manga_id: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  alternative_title: z.string().nullish(),
  cover_image_url: z.string().nullish(),
  cover_portrait_url: z.string().nullish(),
  latest_chapter_id: z.string().nullish(),
  latest_chapter_number: z.number().nullish(),
  latest_chapter_time: z.string().nullish(),
  country_id: z.string().nullish(),
  status: z.number().nullish(),
  user_rate: z.number().nullish(),
  view_count: z.number().nullish(),
  bookmark_count: z.number().nullish(),
  release_year: z.string().nullish(),
  total_chapters: z.number().nullish(),
  taxonomy: z.record(z.string(), z.array(taxonomyItemSchema)).nullish()
});

const listSchema = z.object({
  retcode: z.number(),
  message: z.string().nullish(),
  meta: z
    .object({
      has_next: z.boolean().default(false),
      limit: z.number().default(24),
      offset: z.number().default(0),
      next_cursor: z.string().nullish()
    })
    .default({ has_next: false, limit: 24, offset: 0 }),
  data: z.array(mangaSchema).default([])
});

const detailSchema = z.object({
  retcode: z.number(),
  message: z.string().nullish(),
  data: mangaSchema
});

const chapterSchema = z.object({
  chapter_id: z.string(),
  manga_id: z.string(),
  chapter_title: z.string().nullish(),
  chapter_number: z.number(),
  thumbnail_image_url: z.string().nullish(),
  view_count: z.number().nullish(),
  release_date: z.string().nullish()
});

const chapterListSchema = z.object({
  retcode: z.number(),
  message: z.string().nullish(),
  meta: z
    .object({
      has_next: z.boolean().default(false),
      limit: z.number().default(100),
      next_cursor: z.string().nullish()
    })
    .default({ has_next: false, limit: 100 }),
  data: z.array(chapterSchema).default([])
});

const chapterDetailSchema = z.object({
  retcode: z.number(),
  message: z.string().nullish(),
  data: z.object({
    chapter_id: z.string(),
    manga_id: z.string(),
    chapter_number: z.number(),
    chapter_title: z.string().nullish(),
    base_url: z.string(),
    chapter: z.object({
      path: z.string(),
      data: z.array(z.string()).default([])
    }),
    prev_chapter_id: z.string().nullish(),
    prev_chapter_number: z.number().nullish(),
    next_chapter_id: z.string().nullish(),
    next_chapter_number: z.number().nullish(),
    release_date: z.string().nullish()
  })
});

const taxonomySchema = z.object({
  retcode: z.number(),
  data: z.array(
    z.object({
      taxonomy_id: z.number(),
      slug: z.string(),
      name: z.string(),
      type: z.string()
    })
  )
});

function url(path: string): string {
  return `${env.SHINIGAMI_API_URL.replace(/\/$/, "")}${path}`;
}

function mapStatus(status: number | null | undefined): string {
  if (status === 1) return "Ongoing";
  if (status === 2) return "Selesai";
  if (status === 3) return "Hiatus";
  return "Tidak diketahui";
}

function mapSummary(item: z.infer<typeof mangaSchema>): MangaSummary {
  const taxonomy = item.taxonomy ?? {};
  const genres = (taxonomy.Genre ?? []).map((genre) => genre.name);
  return {
    id: item.manga_id,
    source: "shinigami",
    title: item.title,
    altTitle: item.alternative_title ?? undefined,
    description: truncate(stripHtml(item.description), 900),
    cover: safeHttpUrl(item.cover_portrait_url ?? item.cover_image_url),
    genres,
    status: mapStatus(item.status),
    year: item.release_year ?? undefined,
    author: (taxonomy.Author ?? []).map((author) => author.name).join(", ") || undefined,
    artist: (taxonomy.Artist ?? []).map((artist) => artist.name).join(", ") || undefined,
    rating: item.user_rate ?? undefined,
    views: item.view_count ?? undefined,
    bookmarks: item.bookmark_count ?? undefined,
    latestChapter:
      item.latest_chapter_number !== null && item.latest_chapter_number !== undefined
        ? `Chapter ${item.latest_chapter_number}`
        : undefined,
    language: "id",
    kind: taxonomy.Format?.[0]?.name
  };
}

function mapChapter(item: z.infer<typeof chapterSchema>): MangaChapter {
  return {
    id: item.chapter_id,
    mangaId: item.manga_id,
    number: item.chapter_number,
    title: item.chapter_title?.trim() || `Chapter ${item.chapter_number}`,
    releasedAt: item.release_date ?? undefined,
    language: "id"
  };
}

export async function getCatalog(params: MangaCatalogParams = {}): Promise<Paginated<MangaSummary>> {
  const page = Math.max(0, params.page ?? 0);
  const limit = 24;
  const offset = page * limit;
  const sort = params.sort ?? "latest";
  const sortMap: Record<string, { sort: string; sort_order: string }> = {
    latest: { sort: "latest", sort_order: "desc" },
    popular: { sort: "popularity", sort_order: "desc" },
    rating: { sort: "rating", sort_order: "desc" },
    new_manga: { sort: "new_manga", sort_order: "desc" },
    az: { sort: "title", sort_order: "asc" }
  };
  const ordering = sortMap[sort] ?? sortMap.latest;

  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    sort: ordering.sort,
    sort_order: ordering.sort_order
  });
  if (params.keyword?.trim()) query.set("q", params.keyword.trim());
  if (params.genre?.trim()) query.set("genre", params.genre.trim());

  const key = `shinigami:catalog:${page}:${sort}:${params.keyword ?? ""}:${params.genre ?? ""}`;

  return cached(key, env.CACHE_TTL_SECONDS, async () => {
    const parsed = await fetchJson(url(`/manga/list?${query.toString()}`), listSchema, { source: SOURCE });
    if (parsed.retcode !== 0) {
      throw new SourceError(SOURCE, parsed.message || "Shinigami mengembalikan error.");
    }
    return {
      items: parsed.data.map(mapSummary),
      page,
      hasMore: parsed.meta.has_next,
      total: undefined
    };
  });
}

export async function search(keyword: string, limit = 12): Promise<MangaSummary[]> {
  const clean = keyword.trim();
  if (!clean) return [];
  const result = await cached(`shinigami:search:${clean}:${limit}`, env.CACHE_TTL_SECONDS, async () => {
    const parsed = await fetchJson(
      url(`/manga/list?q=${encodeURIComponent(clean)}&limit=${limit}`),
      listSchema,
      { source: SOURCE }
    );
    if (parsed.retcode !== 0) return [];
    return parsed.data.map(mapSummary);
  });
  return result;
}

export async function getDetail(id: string): Promise<MangaDetail> {
  return cached(`shinigami:detail:${id}`, env.CACHE_TTL_SECONDS, async () => {
    const [detail, chapters] = await Promise.all([
      fetchJson(url(`/manga/detail/${encodeURIComponent(id)}`), detailSchema, { source: SOURCE }),
      fetchJson(
        url(`/chapter/${encodeURIComponent(id)}/list?limit=100&sort_by=chapter_number&sort_order=desc`),
        chapterListSchema,
        { source: SOURCE }
      )
    ]);

    if (detail.retcode !== 0) throw new SourceError(SOURCE, detail.message || "Manga tidak ditemukan.");
    const summary = mapSummary(detail.data);

    return {
      ...summary,
      chapters: chapters.retcode === 0 ? chapters.data.map(mapChapter) : [],
      availableLanguages: ["id"]
    };
  });
}

export async function getChapters(id: string, cursor?: string, limit = 100): Promise<Paginated<MangaChapter> & { cursor?: string }> {
  const query = new URLSearchParams({
    limit: String(limit),
    sort_by: "chapter_number",
    sort_order: "desc"
  });
  if (cursor) query.set("cursor", cursor);

  const parsed = await fetchJson(
    url(`/chapter/${encodeURIComponent(id)}/list?${query.toString()}`),
    chapterListSchema,
    { source: SOURCE }
  );
  if (parsed.retcode !== 0) throw new SourceError(SOURCE, parsed.message || "Daftar chapter tidak tersedia.");

  return {
    items: parsed.data.map(mapChapter),
    page: 0,
    hasMore: parsed.meta.has_next,
    cursor: parsed.meta.next_cursor ?? undefined
  };
}

export async function getReader(chapterId: string): Promise<MangaReader> {
  return cached(`shinigami:reader:${chapterId}`, env.CACHE_TTL_SECONDS, async () => {
    const parsed = await fetchJson(
      url(`/chapter/detail/${encodeURIComponent(chapterId)}`),
      chapterDetailSchema,
      { source: SOURCE }
    );
    if (parsed.retcode !== 0) throw new SourceError(SOURCE, parsed.message || "Chapter tidak ditemukan.");

    const data = parsed.data;
    const base = data.base_url.replace(/\/$/, "");
    const path = data.chapter.path.startsWith("/") ? data.chapter.path : `/${data.chapter.path}`;
    const pages = data.chapter.data
      .map((file) => safeHttpUrl(`${base}${path}${file}`))
      .filter((page): page is string => Boolean(page));

    return {
      mangaId: data.manga_id,
      chapter: {
        id: data.chapter_id,
        mangaId: data.manga_id,
        number: data.chapter_number,
        title: data.chapter_title?.trim() || `Chapter ${data.chapter_number}`,
        releasedAt: data.release_date ?? undefined,
        language: "id",
        pages: pages.length
      },
      pages,
      prev: data.prev_chapter_id
        ? {
            id: data.prev_chapter_id,
            mangaId: data.manga_id,
            number: data.prev_chapter_number ?? 0,
            title: `Chapter ${data.prev_chapter_number ?? ""}`.trim(),
            language: "id"
          }
        : null,
      next: data.next_chapter_id
        ? {
            id: data.next_chapter_id,
            mangaId: data.manga_id,
            number: data.next_chapter_number ?? 0,
            title: `Chapter ${data.next_chapter_number ?? ""}`.trim(),
            language: "id"
          }
        : null
    };
  });
}

export async function getGenres(): Promise<MangaGenre[]> {
  return cached("shinigami:genres", 60 * 60 * 12, async () => {
    const parsed = await fetchJson(url("/taxonomy/list?type=genre&limit=100"), taxonomySchema, { source: SOURCE });
    if (parsed.retcode !== 0) return [];
    return parsed.data.map((item) => ({ id: item.slug, name: item.name }));
  });
}

export const shinigami = {
  getCatalog,
  search,
  getDetail,
  getChapters,
  getReader,
  getGenres
};
