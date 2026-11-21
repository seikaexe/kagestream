import { z } from "zod";

const envSchema = z.object({
  ANIMEIN_API_BASE: z.string().url().default("https://animeinweb.com/api/proxy"),
  ANIMEIN_API_SECRET: z.string().min(1).default("animein-secure-proxy-key-123"),
  ANILIST_API_URL: z.string().url().default("https://graphql.anilist.co"),
  ANISKIP_API_URL: z.string().url().default("https://api.aniskip.com"),
  MANGADEX_API_URL: z.string().url().default("https://api.mangadex.org"),
  SHINIGAMI_API_URL: z.string().url().default("https://api.shinigami.io/v1"),
  KOMIKU_BASE_URL: z.string().url().default("https://komiku.org"),
  WEBTOON_BASE_URL: z.string().url().default("https://www.webtoons.com/id"),
  SOURCE_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(15000),
  CACHE_TTL_SECONDS: z.coerce.number().int().min(0).max(86400).default(300)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const detail = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ");
  throw new Error(`Invalid environment configuration: ${detail}`);
}

export const env = parsed.data;

export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
