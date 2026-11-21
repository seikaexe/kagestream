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
import type { SettingsState, ThemeMode } from "@/types/library";
import { readStored, writeStored } from "@/lib/client/storage";
import { settingsSchema, type StoredSettings } from "@/lib/client/schemas";

const STORAGE_KEY = "kagenime:settings:v1";

const DEFAULTS: SettingsState = {
  theme: "system",
  language: "id",
  readerMode: "vertical",
  dataSaver: false,
  reduceMotion: false
};

interface SettingsContextValue extends SettingsState {
  ready: boolean;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
  update: (patch: Partial<SettingsState>) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(resolved: "light" | "dark", reduceMotion: boolean) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.reduceMotion = reduceMotion ? "true" : "false";
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredSettings>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(readStored(STORAGE_KEY, (value) => settingsSchema.parse(value), DEFAULTS));
    setSystemDark(systemPrefersDark());
    setReady(true);

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: "light" | "dark" =
    state.theme === "system" ? (systemDark ? "dark" : "light") : state.theme;

  useEffect(() => {
    if (!ready) return;
    applyTheme(resolvedTheme, state.reduceMotion);
    writeStored(STORAGE_KEY, state);
  }, [ready, resolvedTheme, state]);

  const setTheme = useCallback((theme: ThemeMode) => {
    setState((current) => ({ ...current, theme }));
  }, []);

  const update = useCallback((patch: Partial<SettingsState>) => {
    setState((current) => ({ ...current, ...patch }));
  }, []);

  const reset = useCallback(() => setState(DEFAULTS), []);

  const value = useMemo<SettingsContextValue>(
    () => ({ ...state, ready, resolvedTheme, setTheme, update, reset }),
    [state, ready, resolvedTheme, setTheme, update, reset]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings harus dipakai di dalam SettingsProvider.");
  return context;
}
