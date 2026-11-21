import Link from "next/link";
import { animeWatchHref } from "@/lib/routes";
import { formatCompact } from "@/lib/utils/text";
import type { AnimeEpisode } from "@/types/anime";

export function AnimeEpisodesTable({ episodes, animeId }: { episodes: AnimeEpisode[]; animeId: string }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wider text-subtle">
          <th className="py-3 pl-1 pr-4">Episode</th>
          <th className="py-3 pr-4">Judul</th>
          <th className="py-3 text-right pr-4">Tayang</th>
          <th className="py-3 text-right pr-1">Nonton</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {episodes.map((episode, index) => (
          <tr key={episode.id || index} className="hover:bg-surface-soft/50">
            <td className="py-3 pl-1 pr-4 text-xs font-medium text-muted tabular-nums">Ep {episode.number}</td>
            <td className="py-3 pr-4 text-sm text-foreground">
              <Link
                href={animeWatchHref(animeId, episode.id)}
                className="block transition-colors hover:text-foreground"
              >
                {episode.title}
              </Link>
            </td>
            <td className="py-3 pr-4 text-right text-xs text-subtle tabular-nums">
              {episode.releasedAt ? new Date(episode.releasedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "—"}
            </td>
            <td className="py-3 text-right text-xs text-muted tabular-nums">
              {episode.views ? formatCompact(episode.views) : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
