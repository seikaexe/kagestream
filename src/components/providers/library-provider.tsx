"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { BookmarkItem, HistoryItem } from "@/types/library";
import { emit, readStored, writeStored } from "@/lib/client/storage";
import { librarySchema, type StoredLibrary } from "@/lib/client/schemas";

const STORAGE_KEY = "kagenime:library:v1";
const MAX_HISTORY = 80;
const MAX_BOOKMARKS = 300;

interface LibraryContextValue {
  ready: boolean;
  bookmarks: BookmarkItem[];
  history: HistoryItem[];
  toggleBookmark: (item: Omit<BookmarkItem, "addedAt">) => void;
  removeBookmark: (key: string) => void;
  isBookmarked: (key: string) => boolean;
  addHistory: (item: Omit<HistoryItem, "updatedAt">) => void;
  removeHistory: (key: string) => void;
  clearHistory: () => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

const EMPTY: StoredLibrary = { bookmarks: [], history: [] };

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredLibrary>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(readStored(STORAGE_KEY, (value) => librarySchema.parse(value), EMPTY));
    setReady(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setState(readStored(STORAGE_KEY, (value) => librarySchema.parse(value), EMPTY));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeStored(STORAGE_KEY, state);
  }, [state, ready]);

  const toggleBookmark = useCallback((item: Omit<BookmarkItem, "addedAt">) => {
    setState((current) => {
      const exists = current.bookmarks.some((bookmark) => bookmark.key === item.key);
      const bookmarks = exists
        ? current.bookmarks.filter((bookmark) => bookmark.key !== item.key)
        : [{ ...item, addedAt: Date.now() }, ...current.bookmarks].slice(0, MAX_BOOKMARKS);
      return { ...current, bookmarks };
    });
    emit("kagenime:library");
  }, []);

  const removeBookmark = useCallback((key: string) => {
    setState((current) => ({
      ...current,
      bookmarks: current.bookmarks.filter((bookmark) => bookmark.key !== key)
    }));
    emit("kagenime:library");
  }, []);

  const addHistory = useCallback((item: Omit<HistoryItem, "updatedAt">) => {
    setState((current) => {
      const entry: HistoryItem = { ...item, updatedAt: Date.now() };
      const history = [entry, ...current.history.filter((existing) => existing.key !== item.key)].slice(
        0,
        MAX_HISTORY
      );
      return { ...current, history };
    });
    emit("kagenime:library");
  }, []);

  const removeHistory = useCallback((key: string) => {
    setState((current) => ({
      ...current,
      history: current.history.filter((entry) => entry.key !== key)
    }));
    emit("kagenime:library");
  }, []);

  const clearHistory = useCallback(() => {
    setState((current) => ({ ...current, history: [] }));
    emit("kagenime:library");
  }, []);

  const value = useMemo<LibraryContextValue>(
    () => ({
      ready,
      bookmarks: state.bookmarks,
      history: state.history,
      toggleBookmark,
      removeBookmark,
      isBookmarked: (key: string) => state.bookmarks.some((bookmark) => bookmark.key === key),
      addHistory,
      removeHistory,
      clearHistory
    }),
    [ready, state, toggleBookmark, removeBookmark, addHistory, removeHistory, clearHistory]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("useLibrary harus dipakai di dalam LibraryProvider.");
  return context;
}
