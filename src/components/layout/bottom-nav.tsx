"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Book, Home, LayoutGrid, Search, Tv } from "lucide-react";
import { cn } from "@/lib/utils/text";

const items = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/anime", label: "Anime", icon: Tv },
  { href: "/manga", label: "Manga", icon: Book },
  { href: "/webtoon", label: "Webtoon", icon: LayoutGrid },
  { href: "/search", label: "Cari", icon: Search }
] as const;

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href + "?");

  return (
    <nav aria-label="Navigasi bawah" className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md sm:hidden">
      <div className="grid h-14 grid-cols-5" role="list">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              role="listitem"
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                active ? "text-strong" : "text-muted"
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-strong" : "text-muted")} aria-hidden />
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
