"use client";

export function readStored<T>(key: string, parse: (value: unknown) => T, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return parse(JSON.parse(raw) as unknown);
  } catch {
    return fallback;
  }
}

export function writeStored(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private mode or when the quota is exhausted.
  }
}

export function emit(event: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(event));
}
