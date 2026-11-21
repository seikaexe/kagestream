import { animein } from "../src/services/anime/animein";
import { anilist } from "../src/services/metadata/anilist";
import { aniskip } from "../src/services/metadata/aniskip";
import { shinigami } from "../src/services/manga/shinigami";
import { komiku } from "../src/services/manga/komiku";
import { mangadex } from "../src/services/manga/mangadex";
import { webtoon } from "../src/services/webtoon/webtoon";

let passedCount = 0;
let failedCount = 0;

async function runTest<T>(name: string, fn: () => Promise<T>): Promise<{ ok: true; result: T } | { ok: false; error: unknown }> {
  try {
    process.stdout.write(`Testing ${name}... `);
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    console.log(`[PASS] (${duration}ms)`);
    passedCount++;
    return { ok: true, result };
  } catch (err: unknown) {
    const error = err as (Error & { cause?: { message?: string } }) | undefined;
    console.log(`[FAIL]: ${error?.message || String(err)}`);
    if (error?.cause) {
      console.log(`  cause:`, error.cause?.message || error.cause);
    }
    failedCount++;
    return { ok: false, error: err };
  }
}

async function main() {
  console.log("========================================");
  console.log("       KAGESTREAM SCRAPER TEST SUITE    ");
  console.log("========================================\n");

  // 1. ANIMEIN
  console.log("--- 1. ANIMEIN ---");
  const homeRes = await runTest("animein.getHome()", () => animein.getHome());
  const catalogRes = await runTest("animein.getCatalog({ page: 0 })", () => animein.getCatalog({ page: 0 }));
  await runTest("animein.getGenres()", () => animein.getGenres());
  await runTest("animein.getSchedule()", () => animein.getSchedule());

  let animeId = "6483";
  if (homeRes.ok && homeRes.result.hot.length > 0) {
    animeId = homeRes.result.hot[0].id;
  } else if (catalogRes.ok && catalogRes.result.items.length > 0) {
    animeId = catalogRes.result.items[0].id;
  }

  const detailRes = await runTest(`animein.getDetail(${animeId})`, () => animein.getDetail(animeId));
  const epsRes = await runTest(`animein.getEpisodes(${animeId}, 0)`, () => animein.getEpisodes(animeId, 0));
  let epId = "322266";
  if (epsRes.ok && epsRes.result.items.length > 0) {
    epId = epsRes.result.items[0].id;
  } else if (detailRes.ok && detailRes.result.episodes?.length > 0) {
    epId = detailRes.result.episodes[0].id;
  }
  await runTest(`animein.getStream(${epId})`, () => animein.getStream(epId));

  // 2. ANILIST
  console.log("\n--- 2. ANILIST ---");
  await runTest("anilist.getTrending(0, 5)", () => anilist.getTrending(0, 5));
  await runTest("anilist.getPopular(0, 5)", () => anilist.getPopular(0, 5));
  await runTest("anilist.searchMedia('Naruto', 5)", () => anilist.searchMedia("Naruto", 5));
  await runTest("anilist.getWeeklySchedule()", () => anilist.getWeeklySchedule());

  // 3. ANISKIP
  console.log("\n--- 3. ANISKIP ---");
  await runTest("aniskip.getSkipTimes(21, 1)", () => aniskip.getSkipTimes(21, 1));

  // 4. SHINIGAMI
  console.log("\n--- 4. SHINIGAMI ---");
  const shiniCatalog = await runTest("shinigami.getCatalog()", () => shinigami.getCatalog({ page: 0 }));
  await runTest("shinigami.getGenres()", () => shinigami.getGenres());
  await runTest("shinigami.search('Solo')", () => shinigami.search("Solo"));
  if (shiniCatalog.ok && shiniCatalog.result.items.length > 0) {
    const mId = shiniCatalog.result.items[0].id;
    await runTest(`shinigami.getDetail(${mId})`, () => shinigami.getDetail(mId));
    const chRes = await runTest(`shinigami.getChapters(${mId})`, () => shinigami.getChapters(mId));
    if (chRes.ok && chRes.result.items.length > 0) {
      const chId = chRes.result.items[0].id;
      await runTest(`shinigami.getReader(${chId})`, () => shinigami.getReader(chId));
    }
  }

  // 5. KOMIKU
  console.log("\n--- 5. KOMIKU ---");
  const komikuCatalog = await runTest("komiku.getCatalog()", () => komiku.getCatalog({ page: 0 }));
  await runTest("komiku.getGenres()", () => komiku.getGenres());
  await runTest("komiku.getSearch('One Piece')", () => komiku.getSearch("One Piece"));
  if (komikuCatalog.ok && komikuCatalog.result.items.length > 0) {
    const kId = komikuCatalog.result.items[0].id;
    await runTest(`komiku.getDetail(${kId})`, () => komiku.getDetail(kId));
    const chRes = await runTest(`komiku.getChapters(${kId})`, () => komiku.getChapters(kId));
    if (chRes.ok && chRes.result.items.length > 0) {
      const chId = chRes.result.items[0].id;
      await runTest(`komiku.getReader(${chId})`, () => komiku.getReader(chId));
    }
  }

  // 6. MANGADEX
  console.log("\n--- 6. MANGADEX ---");
  const mdCatalog = await runTest("mangadex.getCatalog()", () => mangadex.getCatalog({ page: 0 }));
  await runTest("mangadex.getGenres()", () => mangadex.getGenres());
  await runTest("mangadex.search('Naruto')", () => mangadex.search("Naruto"));
  if (mdCatalog.ok && mdCatalog.result.items.length > 0) {
    const mdId = mdCatalog.result.items[0].id;
    await runTest(`mangadex.getDetail(${mdId})`, () => mangadex.getDetail(mdId));
    const chRes = await runTest(`mangadex.getChapters(${mdId})`, () => mangadex.getChapters(mdId));
    if (chRes.ok && chRes.result.items.length > 0) {
      const chId = chRes.result.items[0].id;
      await runTest(`mangadex.getReader(${chId})`, () => mangadex.getReader(chId));
    }
  }

  // 7. WEBTOON
  console.log("\n--- 7. WEBTOON ---");
  const wtOriginals = await runTest("webtoon.getOriginals({ day: 'monday', page: 0 })", () => webtoon.getOriginals({ day: "monday", page: 0 }));
  await runTest("webtoon.getCanvas({ genre: 'ROMANCE', page: 0 })", () => webtoon.getCanvas({ genre: "ROMANCE", page: 0 }));
  const wtSearch = await runTest("webtoon.search('Tower of God')", () => webtoon.search("Tower of God"));
  let wtTarget = wtOriginals.ok && wtOriginals.result.items.length > 0 ? wtOriginals.result.items[0] : null;
  if (!wtTarget && wtSearch.ok && wtSearch.result.length > 0) {
    wtTarget = wtSearch.result[0];
  }
  if (wtTarget) {
    const target = wtTarget;
    const wtId = target.id;
    const wtDetail = await runTest(`webtoon.getDetail(${wtId})`, () => webtoon.getDetail(wtId, { kind: target.kind, genre: target.genre, slug: target.slug }));
    if (wtDetail.ok && wtDetail.result.episodes.length > 0) {
      const firstEp = wtDetail.result.episodes[0];
      await runTest(`webtoon.getViewer(${wtId}, ${firstEp.no})`, () => 
        webtoon.getViewer(wtId, firstEp.no, {
          kind: wtDetail.result.kind,
          genre: wtDetail.result.genre,
          slug: wtDetail.result.slug
        })
      );
    }
  }

  console.log("\n========================================");
  console.log(`TOTAL PASSED: ${passedCount}`);
  console.log(`TOTAL FAILED: ${failedCount}`);
  console.log("========================================");
}

main().catch(console.error);
