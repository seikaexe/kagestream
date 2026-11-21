export type WebtoonKind = "original" | "canvas";

export interface WebtoonSummary {
  id: string;
  kind: WebtoonKind;
  genre: string;
  slug: string;
  title: string;
  author?: string;
  cover?: string;
  subscribers?: string;
  isAdult?: boolean;
}

export interface WebtoonEpisode {
  no: number;
  title: string;
  date?: string;
  thumbnail?: string;
  likes?: number;
  href?: string;
}

export interface WebtoonDetail extends WebtoonSummary {
  description?: string;
  episodes: WebtoonEpisode[];
  episodeCount?: number;
}

export interface WebtoonViewerData {
  webtoon: WebtoonSummary;
  episode: WebtoonEpisode;
  images: string[];
  prev?: WebtoonEpisode | null;
  next?: WebtoonEpisode | null;
}

export interface WebtoonCatalogParams {
  page?: number;
  keyword?: string;
  kind?: WebtoonKind;
  genre?: string;
  day?: string;
}
