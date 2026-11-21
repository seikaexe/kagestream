export const SITE = {
  name: "Kagenime",
  tagline: "Anime, manga, dan webtoon dalam satu tempat.",
  description:
    "Kagenime adalah platform untuk menjelajahi anime, membaca manga, dan menikmati webtoon dengan antarmuka yang bersih dan ringan.",
  developer: "Seika",
  version: "1.0.0"
} as const;

export const NAV_ITEMS = [
  { href: "/", label: "Beranda", icon: "home" },
  { href: "/anime", label: "Anime", icon: "tv" },
  { href: "/manga", label: "Manga", icon: "book" },
  { href: "/webtoon", label: "Webtoon", icon: "panels" },
  { href: "/library", label: "Library", icon: "bookmark" }
] as const;

export const MANGA_SOURCES = [
  {
    id: "shinigami",
    name: "Shinigami",
    description: "Katalog manhwa, manga, dan manhua bahasa Indonesia.",
    supportsGenres: true,
    supportsLanguages: false,
    supportsSearch: true
  },
  {
    id: "komiku",
    name: "Komiku",
    description: "Katalog manga dan manhwa bahasa Indonesia.",
    supportsGenres: false,
    supportsLanguages: false,
    supportsSearch: true
  },
  {
    id: "mangadex",
    name: "MangaDex",
    description: "Katalog resmi multi-bahasa dengan API publik.",
    supportsGenres: true,
    supportsLanguages: true,
    supportsSearch: true
  }
] as const;

export const MANGA_LANGUAGES = [
  { id: "id", label: "Indonesia" },
  { id: "en", label: "English" },
  { id: "ja", label: "日本語 (RAW)" }
] as const;

export const ANIME_SORTS = [
  { id: "views", label: "Terpopuler" },
  { id: "favorites", label: "Favorit" },
  { id: "title", label: "A-Z" },
  { id: "newest", label: "Terbaru" }
] as const;

export const MANGA_SORTS = [
  { id: "latest", label: "Update terbaru" },
  { id: "popular", label: "Paling populer" },
  { id: "rating", label: "Rating tertinggi" },
  { id: "new_manga", label: "Judul baru" },
  { id: "az", label: "A-Z" }
] as const;

export const WEBTOON_ORIGINAL_DAYS = [
  { slug: "monday", label: "Senin" },
  { slug: "tuesday", label: "Selasa" },
  { slug: "wednesday", label: "Rabu" },
  { slug: "thursday", label: "Kamis" },
  { slug: "friday", label: "Jumat" },
  { slug: "saturday", label: "Sabtu" },
  { slug: "sunday", label: "Minggu" },
  { slug: "complete", label: "Selesai" }
] as const;

export const WEBTOON_GENRES = [
  { slug: "", label: "Semua" },
  { slug: "romance", label: "Romance" },
  { slug: "fantasy", label: "Fantasi" },
  { slug: "action", label: "Aksi" },
  { slug: "drama", label: "Drama" },
  { slug: "comedy", label: "Komedi" },
  { slug: "thriller", label: "Thriller" },
  { slug: "slice-of-life", label: "Slice of Life" },
  { slug: "supernatural", label: "Supernatural" },
  { slug: "horror", label: "Horor" },
  { id: "sports", slug: "sports", label: "Olahraga" }
] as const;
