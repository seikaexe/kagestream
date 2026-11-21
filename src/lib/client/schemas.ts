"use client";

import { z } from "zod";

export const bookmarkSchema = z.object({
  key: z.string(),
  kind: z.enum(["anime", "manga", "webtoon"]),
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  image: z.string().optional(),
  href: z.string(),
  addedAt: z.number()
});

export const historySchema = z.object({
  key: z.string(),
  kind: z.enum(["anime", "manga", "webtoon"]),
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  image: z.string().optional(),
  href: z.string(),
  progress: z.string().optional(),
  updatedAt: z.number()
});

export const librarySchema = z.object({
  bookmarks: z.array(bookmarkSchema).catch([]),
  history: z.array(historySchema).catch([])
});

export const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).catch("system"),
  language: z.enum(["id", "en", "ja"]).catch("id"),
  readerMode: z.enum(["vertical", "paged"]).catch("vertical"),
  dataSaver: z.boolean().catch(false),
  reduceMotion: z.boolean().catch(false)
});

export type StoredLibrary = z.infer<typeof librarySchema>;
export type StoredSettings = z.infer<typeof settingsSchema>;
