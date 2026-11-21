import Link from "next/link";
import type { ReactNode } from "react";
import { Star } from "lucide-react";
import { cn, formatCompact } from "@/lib/utils/text";
import { Poster } from "./poster";

interface MediaCardProps {
  href: string;
  title: string;
  image?: string;
  meta?: string;
  secondary?: ReactNode;
  badge?: ReactNode;
  score?: number;
  views?: number;
  className?: string;
  aspect?: "poster" | "portrait";
  priority?: boolean;
}

export function MediaCard({
  href,
  title,
  image,
  meta,
  secondary,
  badge,
  score,
  views,
  className,
  aspect = "poster",
  priority
}: MediaCardProps) {
  return (
    <article className={cn("group min-w-0", className)}>
      <Link href={href} className="block focus-visible:outline-offset-4">
        <div className="relative">
          <Poster src={image} alt={title} title={title} aspect={aspect} priority={priority} />
          {badge ? <div className="absolute left-2 top-2 flex flex-wrap gap-1">{badge}</div> : null}
          {score !== undefined || views !== undefined ? (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              {score !== undefined ? (
                <>
                  <Star className="h-3 w-3 fill-current" aria-hidden />
                  {(score / 10).toFixed(1)}
                </>
              ) : (
                <span>{formatCompact(views)}</span>
              )}
            </div>
          ) : null}
        </div>
        <div className="mt-2.5 space-y-1">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-foreground/70">
            {title}
          </h3>
          {meta ? <p className="truncate text-xs text-muted">{meta}</p> : null}
          {secondary ? <div className="text-xs text-subtle">{secondary}</div> : null}
        </div>
      </Link>
    </article>
  );
}

export function MediaGrid({
  children,
  className,
  dense = false
}: {
  children: ReactNode;
  className?: string;
  dense?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-x-4 gap-y-7",
        dense
          ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
          : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
        className
      )}
    >
      {children}
    </div>
  );
}
