export type AnimeSource = "animein" | "anilist";

export interface AnimeSummary {
  id: string;
  source: AnimeSource;
  title: string;
  altTitle?: string;
  synopsis?: string;
  poster?: string;
  cover?: string;
  type?: string;
  status?: string;
  year?: string;
  season?: string;
  genres: string[];
  studio?: string;
  score?: number;
  views?: number;
  favorites?: number;
  day?: string;
  airedStart?: string;
  totalEpisodes?: number;
}

export interface AnimeEpisode {
  id: string;
  animeId: string;
  number: number;
  title: string;
  views?: number;
  thumbnail?: string;
  releasedAt?: string;
}

export interface SkipTime {
  type: "op" | "ed" | "mixed-op" | "mixed-ed" | "recap";
  startTime: number;
  endTime: number;
  episodeLength?: number;
}

export interface StreamServer {
  id: string;
  name: string;
  quality: string;
  type: "direct" | "semi" | "embed" | "unknown";
  url: string;
  serverId?: string;
}

export interface AnimeStream {
  episode: AnimeEpisode;
  nextEpisode?: AnimeEpisode | null;
  servers: StreamServer[];
  episodes: AnimeEpisode[];
}

export interface AnimeDetail extends AnimeSummary {
  episodes: AnimeEpisode[];
  synonyms?: string;
  anilistId?: number;
  malId?: number;
  banner?: string;
}

export interface AnimeCatalogParams {
  page?: number;
  keyword?: string;
  genre?: string;
  status?: string;
  sort?: string;
}

export interface AnimeScheduleDay {
  day: string;
  date?: string;
  items: AnimeSummary[];
}

export interface AnimeGenre {
  id: string;
  name: string;
  group: string;
  image?: string;
}
