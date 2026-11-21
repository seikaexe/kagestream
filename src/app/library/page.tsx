"use client";

import Link from "next/link";
import { PageHeader, SectionHeader } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { Poster } from "@/components/media/poster";
import { timeAgo } from "@/lib/utils/text";
import type { BookmarkItem, HistoryItem } from "@/types/library";
import { useLibrary } from "@/components/providers/library-provider";

function BookmarkRow({ bookmark }: { bookmark: BookmarkItem }) {
  return (
    <Link
      href={bookmark.href}
      className="flex items-center gap-3 rounded-md border border-border bg-surface-soft/40 px-4 py-3 transition-colors hover:border-strong hover:bg-surface-soft"
    >
      {bookmark.image ? <Poster src={bookmark.image} alt="" className="h-14 w-20 shrink-0" /> : null}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-foreground">{bookmark.title}</h3>
        <p className="mt-0.5 truncate text-xs text-muted">{bookmark.subtitle ?? bookmark.kind}</p>
      </div>
    </Link>
  );
}

function HistoryRow({ entry }: { entry: HistoryItem }) {
  return (
    <Link
      href={entry.href}
      className="flex items-center gap-3 rounded-md border border-border bg-surface-soft/40 px-4 py-3 transition-colors hover:border-strong hover:bg-surface-soft"
    >
      {entry.image ? <Poster src={entry.image} alt="" className="h-14 w-20 shrink-0" /> : null}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-foreground">{entry.title}</h3>
        <div className="mt-0.5 flex gap-2 text-xs text-muted">
          <span>{entry.progress ?? entry.subtitle ?? entry.kind}</span>
          <span aria-hidden>·</span>
          <span>{timeAgo(entry.updatedAt)}</span>
        </div>
      </div>
    </Link>
  );
}

export function LibraryPage() {
  const { ready, bookmarks, history, removeBookmark, removeHistory, clearHistory } = useLibrary();

  if (!ready) return null;

  const recentBookmarks = bookmarks.slice(0, 50);
  const recentHistory = history.slice(0, 50);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Library"
        description="Bookmark anime, manga dan webtoon serta ikuti riwayat membaca."
      />

      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Bookmark"
          subtitle={`${bookmarks.length} item tersimpan`}
        />
        {recentBookmarks.length > 0 ? (
          <div className="flex flex-col gap-2">
            {recentBookmarks.map((bookmark) => (
              <div key={bookmark.key} className="flex items-center justify-between gap-2">
                <BookmarkRow bookmark={bookmark} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBookmark(bookmark.key)}
                  aria-label={`Hapus bookmark ${bookmark.title}`}
                >
                  Hapus
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada bookmark" description="Klik bookmark di halaman anime, manga atau webtoon." />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <SectionHeader title="Riwayat" subtitle={`${history.length} update terakhir`} />
          {history.length > 0 ? (
            <Button variant="outline" size="sm" onClick={clearHistory}>
              Hapus Semua
            </Button>
          ) : null}
        </div>
        {recentHistory.length > 0 ? (
          <div className="flex flex-col gap-2">
            {recentHistory.map((entry) => (
              <div key={entry.key} className="flex items-center justify-between gap-2">
                <HistoryRow entry={entry} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeHistory(entry.key)}
                  aria-label={`Hapus dari riwayat ${entry.title}`}
                >
                  Hapus
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada riwayat" description="Halaman yang Anda kunjungi akan tercatat di sini." />
        )}
      </section>
    </div>
  );
}

export default LibraryPage;
