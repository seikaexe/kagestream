import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"]
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.animein.net" },
      { protocol: "https", hostname: "animein.net" },
      { protocol: "https", hostname: "storages.animein.net" },
      { protocol: "https", hostname: "cdn.shinigami.gg" },
      { protocol: "https", hostname: "thumbnail.komiku.org" },
      { protocol: "https", hostname: "img.komiku.org" },
      { protocol: "https", hostname: "komiku.org" },
      { protocol: "https", hostname: "webtoon-phinf.pstatic.net" },
      { protocol: "https", hostname: "webtoons-static.pstatic.net" },
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "uploads.mangadex.org" },
      { protocol: "https", hostname: "cmdxd98sb0x3yprd.mangadex.network" }
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ];
  }
};

export default nextConfig;
