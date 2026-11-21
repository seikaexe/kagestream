import { z } from "zod";

export const pageSchema = z.coerce.number().int().min(0).max(500).catch(0);

export const keywordSchema = z
  .string()
  .trim()
  .max(120, "Kata kunci terlalu panjang.")
  .catch("");

export const searchKeywordSchema = z
  .string()
  .trim()
  .min(2, "Kata kunci minimal 2 karakter.")
  .max(120, "Kata kunci terlalu panjang.")
  .catch("");

export const animeCatalogQuerySchema = z.object({
  page: pageSchema.default(0),
  q: keywordSchema.default(""),
  genre: z.string().trim().max(40).catch(""),
  status: z.string().trim().max(40).catch(""),
  sort: z.enum(["views", "title", "newest", "favorites"]).catch("views")
});

export const mangaCatalogQuerySchema = z.object({
  page: pageSchema.default(0),
  q: keywordSchema.default(""),
  genre: z.string().trim().max(60).catch(""),
  language: z.enum(["id", "en", "ja"]).catch("id"),
  sort: z.enum(["latest", "popular", "rating", "new_manga", "az"]).catch("latest"),
  source: z.enum(["all", "shinigami", "komiku", "mangadex"]).catch("shinigami")
});

export const webtoonCatalogQuerySchema = z.object({
  page: pageSchema.default(0),
  q: keywordSchema.default(""),
  kind: z.enum(["original", "canvas"]).catch("original"),
  genre: z.string().trim().max(40).catch(""),
  day: z.string().trim().max(40).catch("")
});

export const globalSearchQuerySchema = z.object({
  q: searchKeywordSchema,
  category: z.enum(["all", "anime", "manga", "webtoon"]).catch("all")
});

export const apiSearchQuerySchema = z.object({
  q: searchKeywordSchema,
  limit: z.coerce.number().int().min(1).max(20).catch(6)
});

export const sourceIdSchema = z.object({
  source: z.enum(["shinigami", "komiku", "mangadex"]),
  id: z.string().trim().min(1).max(200)
});

export const animeIdSchema = z.string().trim().regex(/^\d{1,10}$/, "ID anime tidak valid.");
export const episodeIdSchema = z.string().trim().regex(/^\d{1,10}$/, "ID episode tidak valid.");
export const webtoonIdSchema = z.string().trim().regex(/^\d{1,10}$/, "ID webtoon tidak valid.");
