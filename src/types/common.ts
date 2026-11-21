export type ContentKind = "anime" | "manga" | "webtoon";

export interface Paginated<T> {
  items: T[];
  page: number;
  hasMore: boolean;
  total?: number;
}

export interface SourceFailure {
  source: string;
  message: string;
}

export interface AggregatedResult<T> {
  items: T[];
  failures: SourceFailure[];
}

export type SortOrder = "asc" | "desc";
