import type { ContentKind } from "./common";

export interface BookmarkItem {
  key: string;
  kind: ContentKind;
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  href: string;
  addedAt: number;
}

export interface HistoryItem {
  key: string;
  kind: ContentKind;
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  href: string;
  progress?: string;
  updatedAt: number;
}

export interface LibraryState {
  bookmarks: BookmarkItem[];
  history: HistoryItem[];
}

export type ThemeMode = "light" | "dark" | "system";
export type ReadingMode = "vertical" | "paged";
export type PreferredLanguage = "id" | "en" | "ja";

export interface SettingsState {
  theme: ThemeMode;
  language: PreferredLanguage;
  readerMode: ReadingMode;
  dataSaver: boolean;
  reduceMotion: boolean;
}
