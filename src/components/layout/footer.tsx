import Link from "next/link";
import { Clock, Tv } from "lucide-react";
import { SITE } from "@/lib/constants";

export function Footer() {
  const links = [
    { href: "/anime", label: "Anime" },
    { href: "/anime/schedule", label: "Jadwal" },
    { href: "/manga", label: "Manga" },
    { href: "/webtoon", label: "Webtoon" },
    { href: "/library", label: "Library" },
    { href: "/settings", label: "Pengaturan" }
  ] as const;

  return (
    <footer className="container-page pb-10 pt-12">
      <div className="flex flex-col items-center gap-3 border-t border-border pt-6 text-center">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Tv className="h-4 w-4 text-muted" aria-hidden />
          <span>{SITE.name}</span>
        </div>
        <p className="text-[11px] leading-5 text-muted">{SITE.tagline}</p>
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2" aria-label="Footer">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="flex items-center gap-1 text-[11px] text-subtle">
          <Clock className="h-3 w-3" aria-hidden />
          {SITE.version} — anime, manga & webtoon dalam satu tempat
        </p>
      </div>
    </footer>
  );
}
