import { load } from "cheerio";
import { env } from "@/lib/env";
import { cached } from "@/lib/cache";
import { fetchText } from "@/lib/http";
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

const SOURCE = "komiku";
const API_BASE = "https://api.komiku.org";
const PAGE_SIZE = 10;

function absolute(href: string | undefined): string | undefined {
  if (!href) return undefined;
  try {
    return new URL(href, env.KOMIKU_BASE_URL).toString();
  } catch {
    return undefined;
  }
}

function slugFromUrl(value: string | undefined): string {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.pathname.replace(/^\/manga\//, "").replace(/\/$/, "");
  } catch {
    return value.replace(/^\/manga\//, "").replace(/\/$/, "");
  }
}

function chapterNumber(text: string): number {
  const match = text.match(/(?:chapter|ch\.?)\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (match?.[1]) return toNumber(match[1], 0);
  const fallback = text.match(/([0-9]+(?:\.[0-9]+)?)/);
  return fallback?.[1] ? toNumber(fallback[1], 0) : 0;
}

async function fetchHtml(path: string, key: string, ttl = env.CACHE_TTL_SECONDS): Promise<string> {
  return cached(key, ttl, async () => {
    const target = path.startsWith("http") ? path : `${env.KOMIKU_BASE_URL.replace(/\/$/, "")}${path}`;
    return fetchText(target, { source: SOURCE });
  });
}

interface ParsedCard {
  title: string;
  href: string;
  image?: string;
  genres: string[];
  kind?: string;
  synopsis?: string;
  latestChapter?: string;
}

function parseCards(html: string): ParsedCard[] {
  const $ = load(html);
  const cards: ParsedCard[] = [];

  $("article.ls2, article.ls4, article, .bge").each((_, element) => {
    const card = $(element);

    if (card.is("article") || card.hasClass("ls2") || card.hasClass("ls4")) {
      const link = card.find(".ls2j h3 a, .ls2v a, h3 a, a").first();
      const href = absolute(link.attr("href"));
      if (!href || !href.includes("/manga/")) return;

      const title = card.find(".ls2j h3, h3").first().text().replace(/\s+/g, " ").trim();
      if (!title) return;

      const genreText = card.find(".ls2t").first().text().replace(/\s+/g, " ").trim();
      const genres = genreText ? genreText.split(",").map((item) => item.trim()).filter(Boolean) : [];

      const latest = card.find(".ls2l").first().text().replace(/\s+/g, " ").trim();
      const imgEl = card.find(".ls2v img, img").first();
      const image = safeHttpUrl(imgEl.attr("data-src") ?? imgEl.attr("src"));

      const flagSrc = card.find("img.flag").attr("src") || "";
      let kind: string | undefined;
      if (flagSrc.includes("kr")) kind = "Manhwa";
      else if (flagSrc.includes("jp")) kind = "Manga";
      else if (flagSrc.includes("cn")) kind = "Manhua";

      cards.push({
        title,
        href,
        image,
        genres,
        kind,
        synopsis: undefined,
        latestChapter: latest || undefined
      });
      return;
    }

    const link = card.find(".bgei a, .kan h3 a").first();
    const href = absolute(link.attr("href"));
    if (!href || !href.includes("/manga/")) return;

    const title = card.find(".kan h3").first().text().replace(/\s+/g, " ").trim();
    if (!title) return;

    const info = card.find(".tpe1_inf").first().text().replace(/\s+/g, " ").trim();
    const infoParts = info.split(" ").filter(Boolean);
    const kind = infoParts[0];
    const genreText = infoParts.slice(1).join(" ");
    const genres = genreText ? genreText.split(",").map((item) => item.trim()).filter(Boolean) : [];
    const metaText = card.find(".judul2").first().text().replace(/\s+/g, " ").trim();
    const metaGenres = metaText.split("|")[0]?.trim();
    if (metaGenres && genres.length === 0) {
      genres.push(...metaGenres.split(",").map((item) => item.trim()).filter(Boolean));
    }

    const latest = card.find(".new1 a").last().text().replace(/\s+/g, " ").trim();

    cards.push({
      title,
      href,
      image: safeHttpUrl(card.find(".bgei img").first().attr("data-src") ?? card.find(".bgei img").first().attr("src")),
      genres,
      kind,
      synopsis: truncate(stripHtml(card.find(".kan p").first().text()), 400),
      latestChapter: latest || undefined
    });
  });

  return cards;
}

function mapCard(card: ParsedCard): MangaSummary {
  return {
    id: slugFromUrl(card.href),
    source: "komiku",
    title: card.title,
    description: card.synopsis,
    cover: card.image,
    genres: card.genres,
    latestChapter: card.latestChapter,
    language: "id",
    kind: card.kind
  };
}

export async function getCatalog(params: MangaCatalogParams = {}): Promise<Paginated<MangaSummary>> {
  const page = Math.max(0, params.page ?? 0);
  const pageSegment = page > 0 ? `page/${page + 1}/` : "";
  const genre = (params.genre ?? "").trim();
  const keyword = (params.keyword ?? "").trim();

  if (keyword) {
    const result = await getSearch(keyword);
    return { items: result, page: 0, hasMore: false };
  }

  const path = genre ? `/genre/${encodeURIComponent(genre)}/${pageSegment}` : `/manga/${pageSegment}`;
  const key = `komiku:catalog:${genre}:${page}`;
  const html = await fetchHtml(path, key);
  const items = parseCards(html).map(mapCard);

  return {
    items,
    page,
    hasMore: items.length >= PAGE_SIZE
  };
}

export async function getSearch(keyword: string): Promise<MangaSummary[]> {
  const clean = keyword.trim();
  if (!clean) return [];

  return cached(`komiku:search:${clean}`, env.CACHE_TTL_SECONDS, async () => {
    const html = await fetchText(
      `${API_BASE}/?s=${encodeURIComponent(clean)}&post_type=manga`,
      { source: SOURCE, headers: { "HX-Request": "true" } }
    );
    return parseCards(html).map(mapCard);
  });
}

export async function getDetail(slug: string): Promise<MangaDetail> {
  return cached(`komiku:detail:${slug}`, env.CACHE_TTL_SECONDS, async () => {
    const html = await fetchHtml(`/manga/${encodeURIComponent(slug)}/`, `komiku:detail-html:${slug}`);
    const $ = load(html);

    const title =
      $("h1 span[itemprop='name']").first().text().trim() ||
      $("h1").first().text().replace(/^Komik\s+/i, "").trim();
    if (!title) throw new SourceError(SOURCE, "Manga tidak ditemukan.", { code: "not_found" });

    const cover = safeHttpUrl(
      $("#Informasi .ims img").first().attr("src") ??
        $("meta[property='og:image']").attr("content") ??
        undefined
    );
    const description = truncate(
      stripHtml($("#Sinopsis").find("p").map((_, el) => $(el).text()).get().join("\n\n") || $("meta[name='description']").attr("content")),
      1500
    );
    const genres = $("meta[itemprop='genre']")
      .map((_, el) => $(el).attr("content"))
      .get()
      .filter((genre): genre is string => Boolean(genre));
    const status = $("meta[itemprop='creativeWorkStatus']").attr("content");
    const author = $("span[itemprop='author'] meta[itemprop='name']").attr("content");
    const type = $("meta[itemprop='additionalType']").attr("content");
    const published = $("meta[itemprop='datePublished']").attr("content");

    const chapters: MangaChapter[] = [];
    $("#Daftar_Chapter tr[itemprop='itemListElement']").each((_, element) => {
      const row = $(element);
      const link = row.find("a[itemprop='url']").first();
      const href = link.attr("href");
      const label = row.find("span[itemprop='name']").first().text().replace(/\s+/g, " ").trim();
      if (!href || !label) return;
      const id = href.replace(/^\//, "").replace(/\/$/, "");
      chapters.push({
        id,
        mangaId: slug,
        number: chapterNumber(label),
        title: label,
        releasedAt: row.find("td.tanggalseries").first().text().trim() || undefined,
        language: "id"
      });
    });

    return {
      id: slug,
      source: "komiku",
      title,
      description,
      cover,
      genres,
      status: status || undefined,
      author: author || undefined,
      year: published ? new Date(published).getFullYear().toString() : undefined,
      latestChapter: chapters[0]?.title,
      language: "id",
      kind: type || undefined,
      chapters,
      availableLanguages: ["id"],
      externalUrl: absolute(`/manga/${slug}/`)
    };
  });
}

export async function getReader(chapterSlug: string): Promise<MangaReader> {
  return cached(`komiku:reader:${chapterSlug}`, env.CACHE_TTL_SECONDS, async () => {
    const html = await fetchHtml(`/${encodeURIComponent(chapterSlug)}/`, `komiku:reader-html:${chapterSlug}`);
    const $ = load(html);

    const mangaHref = $("span[itemprop='url']").attr("content") ?? $("meta[itemprop='url']").attr("content");
    const mangaSlug = slugFromUrl(mangaHref);
    const chapterTitle = $("h1").first().text().replace(/\s+/g, " ").trim();

    const pages: string[] = [];
    $("#Baca_Komik img.klazy, #Baca_Komik img[data-src]").each((_, element) => {
      const source = $(element).attr("data-src") ?? $(element).attr("src");
      const url = safeHttpUrl(source);
      if (!url) return;
      if (url.includes("opening.webp") || url.includes("bg_transparency")) return;
      if (!pages.includes(url)) pages.push(url);
    });

    if (pages.length === 0) {
      $("img[data-src]").each((_, element) => {
        const url = safeHttpUrl($(element).attr("data-src"));
        if (!url) return;
        if (!/\/upload\d*\//.test(url) && !/komiku/i.test(url)) return;
        if (!pages.includes(url)) pages.push(url);
      });
    }

    const prevHref = $("a[aria-label='Prev']").first().attr("href");
    const nextHref = $("a[aria-label='Next']").first().attr("href");
    const number = chapterNumber(chapterTitle);

    return {
      mangaId: mangaSlug,
      chapter: {
        id: chapterSlug,
        mangaId: mangaSlug,
        number,
        title: chapterTitle || `Chapter ${number}`,
        language: "id",
        pages: pages.length
      },
      pages,
      prev: prevHref
        ? {
            id: prevHref.replace(/^\//, "").replace(/\/$/, ""),
            mangaId: mangaSlug,
            number: 0,
            title: "Chapter sebelumnya",
            language: "id"
          }
        : null,
      next: nextHref
        ? {
            id: nextHref.replace(/^\//, "").replace(/\/$/, ""),
            mangaId: mangaSlug,
            number: 0,
            title: "Chapter berikutnya",
            language: "id"
          }
        : null
    };
  });
}

export async function getGenres(): Promise<MangaGenre[]> {
  return cached("komiku:genres", 60 * 60 * 24, async () => {
    const html = await fetchHtml("/p/daftar-genre/", "komiku:genres-html", 60 * 60 * 24);
    const $ = load(html);
    const genres: MangaGenre[] = [];
    $("a[href*='/genre/']").each((_, element) => {
      const href = $(element).attr("href") ?? "";
      const name = $(element).text().replace(/\s+/g, " ").trim();
      const match = href.match(/\/genre\/([^/]+)\//);
      if (!match?.[1] || !name) return;
      if (genres.some((genre) => genre.id === match[1])) return;
      genres.push({ id: match[1], name });
    });
    return genres;
  });
}

export async function getChapters(slug: string): Promise<Paginated<MangaChapter>> {
  const detail = await getDetail(slug);
  return { items: detail.chapters, page: 0, hasMore: false };
}

export const komiku = {
  getCatalog,
  getSearch,
  getDetail,
  getChapters,
  getReader,
  getGenres
};
