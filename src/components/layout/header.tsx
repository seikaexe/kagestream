"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Book, LayoutGrid, Moon, Search, Sun, Tv, X } from "lucide-react";
import { Poster } from "@/components/media/poster";
import type { GlobalSearchResult } from "@/services/search";
import { animeHref, mangaHref, webtoonHref } from "@/lib/routes";
import { initials } from "@/lib/utils/text";
import { useSettings } from "@/components/providers/settings-provider";
import { useLibrary } from "@/components/providers/library-provider";

type SearchRow =
  | { kind: "anime"; href: string; title: string; image?: string }
  | { kind: "manga"; href: string; title: string; image?: string }
  | { kind: "webtoon"; href: string; title: string; image?: string };

const LABELS: Record<SearchRow["kind"], string> = {
  anime: "Anime",
  manga: "Manga",
  webtoon: "Webtoon"
};

function toRows(result: GlobalSearchResult): SearchRow[] {
  return [
    ...result.anime.map<SearchRow>((item) => ({
      kind: "anime",
      href: animeHref(item.id),
      title: item.title,
      image: item.poster ?? item.cover
    })),
    ...result.manga.map<SearchRow>((item) => ({
      kind: "manga",
      href: mangaHref(item.source, item.id),
      title: item.title,
      image: item.cover
    })),
    ...result.webtoons.map<SearchRow>((item) => ({
      kind: "webtoon",
      href: webtoonHref(item),
      title: item.title,
      image: item.cover
    }))
  ];
}

function SearchRowItem({ row }: { row: SearchRow }) {
  return (
    <Link
      href={row.href}
      className="flex items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors hover:bg-surface-soft focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1"
    >
      {row.image ? (
        <Poster src={row.image} alt="" title={row.title} className="h-9 w-12" />
      ) : (
        <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md bg-surface-soft text-[11px] font-semibold text-muted">
          {initials(row.title)}
        </div>
      )}
      <span className="min-w-0 truncate text-sm text-foreground">{row.title}</span>
    </Link>
  );
}

function ResultsGroup({ label, rows }: { label: string; rows: SearchRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="border-b border-border pb-1 last:border-b-0">
      <p className="px-2.5 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-wider text-subtle">{label}</p>
      {rows.map((row) => (
        <SearchRowItem key={`${row.kind}:${row.href}`} row={row} />
      ))}
    </div>
  );
}

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const trimmed = query.trim();
  const enabled = trimmed.length >= 2;

  const { data, isFetching, error } = useQuery({
    queryKey: ["quick-search", trimmed],
    enabled,
    retry: false,
    queryFn: async (): Promise<GlobalSearchResult> => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=6`);
      if (!response.ok) throw new Error("Pencarian gagal");
      return response.json();
    },
    staleTime: 0,
    gcTime: 30_000
  });

  const rows = data ? toRows(data) : [];

  return (
    <div className="relative w-full max-w-xs">
      <form
        role="search"
        action="/search"
        method="get"
        className="relative"
        onSubmit={() => setOpen(false)}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden />
        <input
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder="Cari anime, manga, webtoon"
          aria-label="Pencarian"
          enterKeyHint="search"
          className="h-9 w-full rounded-md border border-border bg-surface px-9 text-sm text-foreground transition-colors placeholder:text-subtle focus-visible:border-strong focus-visible:outline-none"
        />
        {trimmed ? (
          <button type="submit" aria-label="Cari" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted transition-colors hover:bg-surface-soft hover:text-foreground">
            {isFetching ? <Search className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
          </button>
        ) : null}
      </form>

      {open && enabled ? (
        <div className="absolute top-full left-0 right-0 z-30 mt-2 max-h-96 overflow-auto rounded-md border border-border bg-surface shadow-card">
          {isFetching && data === undefined ? (
            <p className="px-3 py-3 text-xs text-muted">Memuat hasil…</p>
          ) : rows.length > 0 ? (
            Object.entries(LABELS).map(([kind, label]) => (
              <ResultsGroup
                key={kind}
                label={label}
                rows={rows.filter((row) => row.kind === (kind as SearchRow["kind"]))}
              />
            ))
          ) : (
            <p className="px-3 py-3 text-xs text-muted">
              {error ? "Tidak dapat memuat hasil pencarian." : "Tidak ada hasil ditemukan."}
            </p>
          )}
          <Link
            href={{ pathname: "/search", search: new URLSearchParams({ q: trimmed }).toString() }}
            className="flex w-full items-center justify-between px-3 py-2.5 text-xs font-medium text-muted transition-colors hover:bg-surface-soft hover:text-foreground"
          >
            Lihat semua hasil
            <X className="h-3.5 w-3.5 rotate-45" aria-hidden />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useSettings();
  return (
    <button
      type="button"
      aria-label="Atur tema"
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-soft hover:text-foreground"
    >
      {resolvedTheme === "light" ? (
        <Moon className="h-4 w-4" aria-hidden />
      ) : (
        <Sun className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}

export function LibraryButton() {
  const { ready, bookmarks } = useLibrary();
  return (
    <Link
      href="/library"
      aria-label="Library"
      className="relative rounded-md p-1.5 text-muted transition-colors hover:bg-surface-soft hover:text-foreground"
    >
      <Bookmark className="h-5 w-5" aria-hidden />
      {ready && bookmarks.length > 0 ? (
        <span className="absolute -top-1 -right-1 min-w-[18px] rounded-full bg-strong px-1 text-center text-[10px] leading-4 font-medium text-on-strong">
          {bookmarks.length > 99 ? "99+" : bookmarks.length}
        </span>
      ) : null}
    </Link>
  );
}

function Logo() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-baseline gap-1.5 text-base font-semibold tracking-tight text-foreground"
    >
      Kagenime
      <span aria-hidden className="h-2 w-2 rounded-sm bg-strong" />
    </Link>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-md backdrop-saturate-150">
      <div className="container-page flex items-center gap-4 py-2.5">
        <Logo />
        <SearchBox />
        <nav aria-label="Navigasi utama" className="ml-auto flex items-center gap-1">
          {([
            { href: "/anime", label: "Anime", icon: Tv },
            { href: "/manga", label: "Manga", icon: Book },
            { href: "/webtoon", label: "Webtoon", icon: LayoutGrid },
            { href: "/library", label: "Library" }
          ] as const).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hidden rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-soft hover:text-foreground sm:inline-flex"
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
          <LibraryButton />
        </nav>
      </div>
    </header>
  );
}

