import { NextResponse } from "next/server";
import { z } from "zod";
import { getMangaReader } from "@/services/manga";

const querySchema = z.object({
  source: z.enum(["shinigami", "komiku", "mangadex"]),
  chapterId: z.string().trim().min(1).max(200)
});

export async function GET(request: Request) {
  const params = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!params.success) {
    return NextResponse.json({ error: "Parameter tidak valid." }, { status: 400 });
  }
  const reader = await getMangaReader(params.data.source, params.data.chapterId);
  return NextResponse.json(reader);
}
