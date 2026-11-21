import { WebtoonCatalogPage } from "../catalog-page";

export const dynamic = "force-dynamic";

export default function CanvasPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <WebtoonCatalogPage kind="canvas" searchParams={searchParams} />;
}
