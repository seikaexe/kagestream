import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/text";

export function Badge({
  children,
  tone = "neutral",
  className
}: {
  children: ReactNode;
  tone?: "neutral" | "strong" | "outline";
  className?: string;
}) {
  const tones = {
    neutral: "bg-surface-soft text-muted",
    strong: "bg-strong text-on-strong",
    outline: "border border-border text-muted"
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-5",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel = "Lihat semua",
  className
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-foreground"
        >
          {linkLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-subtle">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function Pagination({
  page,
  hasMore,
  buildHref
}: {
  page: number;
  hasMore: boolean;
  buildHref: (page: number) => string;
}) {
  if (page === 0 && !hasMore) return null;
  return (
    <nav className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6" aria-label="Navigasi halaman">
      {page > 0 ? (
        <Link
          href={buildHref(page - 1)}
          className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm text-foreground transition-colors hover:bg-surface-soft"
        >
          Sebelumnya
        </Link>
      ) : (
        <span className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm text-subtle opacity-50">
          Sebelumnya
        </span>
      )}
      <span className="text-xs text-muted">Halaman {page + 1}</span>
      {hasMore ? (
        <Link
          href={buildHref(page + 1)}
          className="inline-flex h-9 items-center rounded-md bg-strong px-4 text-sm font-medium text-on-strong transition-opacity hover:opacity-85"
        >
          Berikutnya
        </Link>
      ) : (
        <span className="inline-flex h-9 items-center rounded-md bg-surface-soft px-4 text-sm text-subtle">
          Berikutnya
        </span>
      )}
    </nav>
  );
}
