import { NextResponse } from "next/server";
import { apiSearchQuerySchema } from "@/lib/validators/query";
import { globalSearch } from "@/services/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = apiSearchQuerySchema.parse({
    q: searchParams.get("q"),
    limit: searchParams.get("limit")
  });

  const result = await globalSearch(params.q);

  return NextResponse.json({
    anime: result.anime,
    manga: result.manga,
    webtoons: result.webtoons,
    failures: result.failures
  });
}
