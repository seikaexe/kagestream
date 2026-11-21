"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn, initials } from "@/lib/utils/text";

interface PosterProps {
  src?: string;
  alt: string;
  title?: string;
  className?: string;
  aspect?: "poster" | "portrait" | "wide" | "square";
  priority?: boolean;
  sizes?: string;
}

const ASPECTS = {
  poster: "aspect-[2/3]",
  portrait: "aspect-[3/4]",
  wide: "aspect-video",
  square: "aspect-square"
} as const;

export function Poster({
  src,
  alt,
  title,
  className,
  aspect = "poster",
  priority = false
}: PosterProps) {
  const [attempt, setAttempt] = useState({ src, failed: false, loaded: false });
  const failed = attempt.src !== src ? false : attempt.failed;
  const loaded = attempt.src === src && attempt.loaded;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-surface-soft",
        ASPECTS[aspect],
        className
      )}
    >
      {src && !failed ? (
        <>
          {!loaded ? <div className="skeleton absolute inset-0 rounded-md" aria-hidden /> : null}
          {/* Remote art is hotlink output from public sources; plain img keeps the optimizer out of the hot path. */}
          <img
            src={src}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setAttempt({ src: src as string, failed: false, loaded: true })}
            onError={() => setAttempt({ src: src as string, failed: true, loaded: false })}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0"
            )}
          />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-surface-soft">
          {title ? (
            <span className="px-2 text-center text-lg font-semibold text-subtle">{initials(title)}</span>
          ) : (
            <ImageOff className="h-6 w-6 text-subtle" aria-hidden />
          )}
        </div>
      )}
    </div>
  );
}
