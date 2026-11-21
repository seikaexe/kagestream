export type MangaSource = "shinigami" | "komiku" | "mangadex";

export interface MangaSummary {
  id: string;
  source: MangaSource;
  title: string;
  altTitle?: string;
  description?: string;
  cover?: string;
  genres: string[];
  status?: string;
  year?: string;
  author?: string;
  artist?: string;
  rating?: number;
  views?: number;
  bookmarks?: number;
  latestChapter?: string;
  language?: string;
  kind?: string;
}

export interface MangaChapter {
  id: string;
  mangaId: string;
  number: number;
  title: string;
  releasedAt?: string;
  group?: string;
  language?: string;
  pages?: number;
}

export interface MangaDetail extends MangaSummary {
  chapters: MangaChapter[];
  availableLanguages?: string[];
  externalUrl?: string;
}

export interface MangaReader {
  mangaId: string;
  chapter: MangaChapter;
  pages: string[];
  prev?: MangaChapter | null;
  next?: MangaChapter | null;
}

export interface MangaCatalogParams {
  page?: number;
  keyword?: string;
  genre?: string;
  language?: string;
  sort?: string;
  source?: MangaSource | "all";
}

export interface MangaGenre {
  id: string;
  name: string;
}

export interface MangaSourceInfo {
  id: MangaSource;
  name: string;
  description: string;
  supportsGenres: boolean;
  supportsLanguages: boolean;
  supportsSearch: boolean;
}
