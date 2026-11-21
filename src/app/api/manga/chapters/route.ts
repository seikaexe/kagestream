import { NextResponse } from "next/server";
import { z } from "zod";
import { getMangaChapters } from "@/services/manga";

const querySchema = z.object({
  source: z.enum(["shinigami", "komiku", "mangadex"]),
  id: z.string().trim().min(1).max(200),
  page: z.coerce.number().int().min(1).catch(1)
});

export async function GET(request: Request) {
  const params = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!params.success) {
    return NextResponse.json({ error: "Parameter tidak valid." }, { status: 400 });
  }
  const result = await getMangaChapters(params.data.source, params.data.id);
  return NextResponse.json(result);
}
