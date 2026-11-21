import { z } from "zod";
import { env } from "@/lib/env";
import { cached } from "@/lib/cache";
import { fetchJson } from "@/lib/http";
import { SourceError } from "@/lib/errors";
import type { SkipTime } from "@/types/anime";

const SOURCE = "aniskip";

const responseSchema = z.object({
  found: z.boolean(),
  results: z
    .array(
      z.object({
        interval: z.object({
          startTime: z.number(),
          endTime: z.number()
        }),
        skipType: z.enum(["op", "ed", "mixed-op", "mixed-ed", "recap"]),
        episodeLength: z.number().nullish()
      })
    )
    .default([]),
  statusCode: z.number().default(200)
});

export async function getSkipTimes(
  malId: number | undefined,
  episode: number,
  episodeLength?: number
): Promise<SkipTime[]> {
  if (!malId || !Number.isFinite(malId) || malId <= 0 || !Number.isFinite(episode) || episode <= 0) {
    return [];
  }

  const key = `aniskip:${malId}:${episode}:${episodeLength ?? 0}`;

  return cached(key, 60 * 60 * 12, async () => {
    const query = new URLSearchParams({ types: "op" });
    query.append("types", "ed");
    query.set("episodeLength", String(episodeLength && episodeLength > 0 ? episodeLength : 0));

    try {
      const parsed = await fetchJson(
        `${env.ANISKIP_API_URL.replace(/\/$/, "")}/v2/skip-times/${malId}/${episode}?${query.toString()}`,
        responseSchema,
        { source: SOURCE, retries: 1 }
      );

      if (!parsed.found) return [];

      return parsed.results
        .map((result) => ({
          type: result.skipType,
          startTime: result.interval.startTime,
          endTime: result.interval.endTime,
          episodeLength: result.episodeLength ?? undefined
        }))
        .filter((result) => Number.isFinite(result.startTime) && Number.isFinite(result.endTime) && result.endTime > result.startTime)
        .sort((a, b) => a.startTime - b.startTime);
    } catch (error) {
      if (error instanceof SourceError && (error.code === "not_found" || error.status === 404)) return [];
      throw error;
    }
  });
}

export const aniskip = { getSkipTimes };
