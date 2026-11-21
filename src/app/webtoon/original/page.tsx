import { WebtoonCatalogPage } from "../catalog-page";

export const dynamic = "force-dynamic";

export default function OriginalPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <WebtoonCatalogPage kind="original" defaultDay="saturday" searchParams={searchParams} />;
}
