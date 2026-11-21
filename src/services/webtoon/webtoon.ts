import { load } from "cheerio";
import { env } from "@/lib/env";
import { cached } from "@/lib/cache";
import { fetchText } from "@/lib/http";
import { SourceError } from "@/lib/errors";
import { safeHttpUrl, stripHtml, toNumber, truncate } from "@/lib/utils/text";
import type {
  WebtoonCatalogParams,
  WebtoonDetail,
  WebtoonEpisode,
  WebtoonKind,
  WebtoonSummary,
  WebtoonViewerData
} from "@/types/webtoon";
import type { Paginated } from "@/types/common";

const SOURCE = "webtoon";

const DAY_SLUGS = new Set([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "complete"
]);

const CANVAS_GENRES = new Set([
  "ALL",
  "ALL_AGES",
  "ANIMALS",
  "COMEDY",
  "CRIME_MYSTERY",
  "DRAMA",
  "FANTASY",
  "HEARTWARMING",
  "HISTORICAL",
  "HORROR",
  "ROMANCE",
  "SCIENCE_FICTION",
  "SLICE_OF_LIFE",
  "SPORTS",
  "SUPERHERO",
  "THRILLER"
]);

function base(path = ""): string {
  const suffix = path.replace(/^\/id/, "");
  return `${env.WEBTOON_BASE_URL.replace(/\/$/, "")}${suffix}`;
}

function absolute(href: string | undefined): string | undefined {
  if (!href) return undefined;
  try {
    return new URL(href, env.WEBTOON_BASE_URL).toString();
  } catch {
    return undefined;
  }
}

interface ParsedPath {
  kind: WebtoonKind;
  genre: string;
  slug: string;
}

function parsePath(href: string | undefined): ParsedPath | undefined {
  if (!href) return undefined;
  try {
    const url = new URL(href);
    const parts = url.pathname.split("/").filter(Boolean);
    // /id/{genre-or-canvas}/{slug}/list
    const idIndex = parts.indexOf("id");
    if (idIndex === -1) return undefined;
    const rest = parts.slice(idIndex + 1);
    if (rest.length < 3) return undefined;
    const [genre, slug] = rest;
    if (!genre || !slug) return undefined;
    return {
      kind: genre === "canvas" ? "canvas" : "original",
      genre,
      slug
    };
  } catch {
    return undefined;
  }
}

function titleNoFromHref(href: string | undefined): string | undefined {
  if (!href) return undefined;
  try {
    const value = new URL(href).searchParams.get("title_no");
    return value && /^\d+$/.test(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

function parseList(html: string): WebtoonSummary[] {
  const $ = load(html);
  const items: WebtoonSummary[] = [];
  const seen = new Set<string>();

  $("a.link, a.challenge_item, a[data-title-no]").each((_, element) => {
    const anchor = $(element);
    const href = anchor.attr("href");
    const id = anchor.attr("data-title-no") ?? titleNoFromHref(href);
    const path = parsePath(href);
    if (!id || !path) return;
    if (seen.has(id)) return;

    const title = anchor
      .find(".info_text .title, .subj, .title")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();
    if (!title) return;

    const author = anchor
      .find(".info_text .author, .author")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();
    const genreText = anchor
      .find(".info_text .genre, .genre")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();
    const image = anchor.find("img").first();
    const cover =
      safeHttpUrl(image.attr("data-src")) ??
      safeHttpUrl(image.attr("src")) ??
      safeHttpUrl(anchor.find(".image_wrap img").first().attr("src"));
    const subscribers = anchor
      .find(".view_count, .grade_num, .cnt")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();
    const isAdult =
      anchor.find("[data-title-unsuitable-for-children='true']").length > 0 ||
      anchor.closest("[data-title-unsuitable-for-children='true']").length > 0;

    seen.add(id);
    items.push({
      id,
      kind: path.kind,
      genre: genreText || path.genre,
      slug: path.slug,
      title,
      author: author || undefined,
      cover,
      subscribers: subscribers || undefined,
      isAdult
    });
  });

  return items;
}

async function fetchPage(path: string, key: string): Promise<string> {
  return cached(key, env.CACHE_TTL_SECONDS, async () => fetchText(base(path), { source: SOURCE }));
}

function normalizeGenre(genre: string | undefined): string {
  return (genre ?? "").trim();
}

export async function getOriginals(params: WebtoonCatalogParams = {}): Promise<Paginated<WebtoonSummary>> {
  const page = Math.max(0, params.page ?? 0);
  const genre = normalizeGenre(params.genre);
  const day = (params.day ?? "").toLowerCase();
  const keyword = normalizeGenre(params.keyword);

  if (keyword) {
    const results = await search(keyword, "original");
    return { items: results, page: 0, hasMore: false };
  }

  if (genre) {
    const path = `/id/genres/${encodeURIComponent(genre)}?page=${page + 1}&sortOrder=MANA`;
    const html = await fetchPage(path, `webtoon:originals:genre:${genre}:${page}`);
    const items = parseList(html);
    return { items, page, hasMore: items.length >= 20 };
  }

  const daySlug = DAY_SLUGS.has(day) ? day : "saturday";
  const path = `/id/originals/${daySlug}?page=${page + 1}&sortOrder=MANA`;
  const html = await fetchPage(path, `webtoon:originals:${daySlug}:${page}`);
  const items = parseList(html);
  return { items, page, hasMore: items.length >= 20 };
}

export async function getCanvas(params: WebtoonCatalogParams = {}): Promise<Paginated<WebtoonSummary>> {
  const page = Math.max(0, params.page ?? 0);
  const keyword = normalizeGenre(params.keyword);
  if (keyword) {
    const results = await search(keyword, "canvas");
    return { items: results, page: 0, hasMore: false };
  }

  const rawGenre = normalizeGenre(params.genre);
  const genreTab = rawGenre ? rawGenre.replace(/-/g, "_").toUpperCase() : "ALL";
  const tab = CANVAS_GENRES.has(genreTab) ? genreTab : "ALL";
  const path = `/id/canvas/list?genreTab=${encodeURIComponent(tab)}&page=${page + 1}&sortOrder=UPDATE`;
  const html = await fetchPage(path, `webtoon:canvas:${tab}:${page}`);
  const items = parseList(html).filter((item) => item.kind === "canvas");
  return { items, page, hasMore: items.length >= 20 };
}

export async function search(keyword: string, kind?: WebtoonKind, limit = 40): Promise<WebtoonSummary[]> {
  const clean = keyword.trim();
  if (!clean) return [];

  return cached(`webtoon:search:${kind ?? "all"}:${clean}`, env.CACHE_TTL_SECONDS, async () => {
    const path = kind === "canvas"
      ? `/id/search/canvas?keyword=${encodeURIComponent(clean)}`
      : `/id/search?keyword=${encodeURIComponent(clean)}`;
    const html = await fetchText(base(path), { source: SOURCE });
    const items = parseList(html);
    const filtered = kind ? items.filter((item) => item.kind === kind) : items;
    return filtered.slice(0, limit);
  });
}

export async function getDetail(
  id: string,
  options: { kind?: WebtoonKind; genre?: string; slug?: string; episode?: number } = {}
): Promise<WebtoonDetail> {
  let kind = options.kind ?? "original";
  let genre = options.genre?.trim() || (kind === "canvas" ? "canvas" : "");
  let slug = options.slug?.trim();

  if (!slug || !genre) {
    try {
      const results = await search(id);
      const match = results.find((item) => item.id === id) ?? results[0];
      if (match) {
        kind = match.kind;
        genre = match.genre;
        slug = match.slug;
      }
    } catch {
      // Fall through to error check
    }
  }

  if (!slug || !genre) {
    throw new SourceError(SOURCE, "Tautan webtoon tidak lengkap. Buka judul dari katalog.", {
      code: "not_found"
    });
  }

  return cached(`webtoon:detail:${kind}:${genre}:${slug}:${id}`, env.CACHE_TTL_SECONDS, async () => {
    const html = await fetchPage(
      `/id/${encodeURIComponent(genre)}/${encodeURIComponent(slug)}/list?title_no=${encodeURIComponent(id)}`,
      `webtoon:detail-html:${id}`
    );
    const $ = load(html);

    const title = $("h1.subj").first().text().replace(/\s+/g, " ").trim();
    if (!title) throw new SourceError(SOURCE, "Webtoon tidak ditemukan.", { code: "not_found" });

    const genreText = $("h2.genre").first().text().replace(/\s+/g, " ").trim();
    const authorText = $(".detail_header .author_area").first().text().replace(/\s+/g, " ").trim();
    const cover = safeHttpUrl($("meta[property='og:image']").attr("content"));
    const description = truncate(
      stripHtml(
        $(".detail_body .summary").first().text() || $("meta[property='og:description']").attr("content")
      ),
      1600
    );
    const subscribers = $(".detail_body .grade_area .ico_subscribe").parent().find(".cnt").first().text().trim();
    const isAdult = $(".detail_body .age_text").length > 0;

    const episodes: WebtoonEpisode[] = [];
    $("#_listUl li._episodeItem, #_listUl li[data-episode-no]").each((_, element) => {
      const item = $(element);
      const link = item.find("a.detail_list_link").first();
      const href = absolute(link.attr("href"));
      const no = toNumber(item.attr("data-episode-no"), 0);
      const episodeTitle = link.find(".subj").first().text().replace(/\s+/g, " ").trim();
      const date = link.find(".date").first().text().trim();
      const likes = link.find(".like_area").first().text().replace(/[^0-9]/g, "");
      const thumbnail = safeHttpUrl(link.find("img").first().attr("src"));
      if (!no) return;
      episodes.push({
        no,
        title: episodeTitle || `Episode ${no}`,
        date: date || undefined,
        thumbnail,
        likes: likes ? toNumber(likes, 0) : undefined,
        href
      });
    });

    const episodeCount = toNumber($(".episode_count").first().text().replace(/[^0-9]/g, ""), episodes.length);

    return {
      id,
      kind,
      genre: genreText || genre,
      slug,
      title,
      author: authorText || undefined,
      cover,
      subscribers: subscribers || undefined,
      isAdult,
      description,
      episodes,
      episodeCount: Number.isFinite(episodeCount) ? episodeCount : episodes.length
    };
  });
}

export async function getEpisodeList(
  id: string,
  options: { kind?: WebtoonKind; genre?: string; slug?: string } = {}
): Promise<WebtoonEpisode[]> {
  const detail = await getDetail(id, options);
  return detail.episodes;
}

export async function getViewer(
  id: string,
  episode: number,
  options: { kind?: WebtoonKind; genre?: string; slug?: string } = {}
): Promise<WebtoonViewerData> {
  const kind = options.kind ?? "original";
  const genre = options.genre?.trim() || (kind === "canvas" ? "canvas" : "");
  const slug = options.slug?.trim();

  if (!slug || !genre) {
    throw new SourceError(SOURCE, "Tautan episode tidak lengkap. Buka episode dari halaman webtoon.", {
      code: "not_found"
    });
  }

  return cached(`webtoon:viewer:${kind}:${genre}:${slug}:${id}:${episode}`, env.CACHE_TTL_SECONDS, async () => {
    const html = await fetchPage(
      `/id/${encodeURIComponent(genre)}/${encodeURIComponent(slug)}/episode-${episode}/viewer?title_no=${encodeURIComponent(id)}&episode_no=${episode}`,
      `webtoon:viewer-html:${id}:${episode}`
    );
    const $ = load(html);

    const images: string[] = [];
    $("img._images, #_imageList img").each((_, element) => {
      const url = safeHttpUrl($(element).attr("data-url"));
      if (!url) return;
      if (url.includes("bg_transparency") || url.includes("warning.png")) return;
      if (!images.includes(url)) images.push(url);
    });

    if (images.length === 0) {
      throw new SourceError(SOURCE, "Gambar episode tidak tersedia.", { code: "not_found" });
    }

    const title =
      $(".subj__episode, h1.subj_episode").first().text().replace(/\s+/g, " ").trim() ||
      $("meta[property='og:title']").attr("content") ||
      `Episode ${episode}`;

    const prevHref = $("a.pg_prev").first().attr("href");
    const nextHref = $("a.pg_next").first().attr("href");
    const prevEpisode = prevHref ? Number(new URL(prevHref, env.WEBTOON_BASE_URL).searchParams.get("episode_no")) : 0;
    const nextEpisode = nextHref ? Number(new URL(nextHref, env.WEBTOON_BASE_URL).searchParams.get("episode_no")) : 0;

    return {
      webtoon: {
        id,
        kind,
        genre,
        slug,
        title: $("meta[property='og:title']").attr("content")?.split(" - ")[0]?.trim() || title,
        cover: undefined
      },
      episode: {
        no: episode,
        title
      },
      images,
      prev: Number.isFinite(prevEpisode) && prevEpisode > 0
        ? { no: prevEpisode, title: `Episode ${prevEpisode}` }
        : null,
      next: Number.isFinite(nextEpisode) && nextEpisode > 0
        ? { no: nextEpisode, title: `Episode ${nextEpisode}` }
        : null
    };
  });
}

export const webtoon = {
  getOriginals,
  getCanvas,
  search,
  getDetail,
  getEpisodeList,
  getViewer
};
