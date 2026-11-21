import Link from "next/link";
import { Badge, PageHeader } from "@/components/ui/layout";
import { Poster } from "@/components/media/poster";
import { EmptyState } from "@/components/ui/states";
import { animeHref } from "@/lib/routes";
import { getAnimeSchedule } from "@/services/anime";
import { cn } from "@/lib/utils/text";

export const dynamic = "force-dynamic";

const DAY_STYLE: Record<string, string> = {
  Senin: "bg-red-500/10 text-red-600 dark:text-red-400",
  Selasa: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  Rabu: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Kamis: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Jumat: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  Sabtu: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Minggu: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  Lainnya: "bg-slate-500/10 text-slate-600 dark:text-slate-400"
};

export default async function AnimeSchedulePage() {
  const schedule = await getAnimeSchedule();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Jadwal Anime"
        description="Lihat anime yang tayang hari ini dan minggu ini berdasarkan jadwal sumber."
      />
      {schedule.length === 0 ? (
        <EmptyState title="Belum ada jadwal" description="Jadwal belum tersedia saat ini." />
      ) : (
        <div className="flex flex-col gap-8">
          {schedule.map((group) => (
            <section key={group.day} className="flex flex-col gap-4">
              <h2 className="flex items-center gap-3 text-base font-semibold text-foreground">
                <span className={cn("h-3 w-8 rounded-sm border-l-2", DAY_STYLE[group.day] ?? "bg-slate-500/10 text-slate-500 border-slate-500/30")} />
                {group.day}
                <span className="text-sm font-normal text-muted">{group.items.length} anime</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <article key={item.id} className="rounded-md border border-border bg-surface-soft/40 px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Poster
                        src={item.poster ?? item.cover}
                        alt=""
                        title={item.title}
                        className="h-8 w-8"
                      />
                      <div className="min-w-0">
                        <Link
                          href={animeHref(item.id)}
                          className="block truncate text-sm font-medium text-foreground hover:text-foreground transition-colors"
                        >
                          {item.title}
                        </Link>
                        <div className="mt-0.5 flex flex-wrap gap-1 text-[11px] text-subtle">
                          {item.type ? <Badge>{item.type}</Badge> : null}
                          {item.year ? <Badge>{item.year}</Badge> : null}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
