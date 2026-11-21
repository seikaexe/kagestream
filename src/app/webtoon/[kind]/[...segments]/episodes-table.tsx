import Link from "next/link";
import type { WebtoonEpisode } from "@/types/webtoon";

export function EpisodesTable({
  episodes,
  detailHref
}: {
  episodes: WebtoonEpisode[];
  detailHref: (no: number) => string;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wider text-subtle">
          <th className="py-3 pl-1 pr-3">Episode</th>
          <th className="py-3 pl-3 pr-3">Judul</th>
          <th className="py-3 text-right pr-3">Dipublikasi</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {episodes.map((episode) => (
          <tr key={`${episode.no}:${episode.title}`} className="hover:bg-surface-soft/50">
            <td className="py-3 pl-1 pr-3 text-xs font-medium text-muted tabular-nums">Ep {episode.no}</td>
            <td className="py-3 pr-3">
              <Link href={episode.href ?? detailHref(episode.no)} className="block transition-colors hover:text-foreground">
                {episode.title}
              </Link>
            </td>
            <td className="py-3 text-right text-xs text-subtle tabular-nums">{episode.date ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
