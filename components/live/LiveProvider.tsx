"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { LiveGame, LiveSummary } from "@/lib/live/types";

interface LiveContextValue {
  /** TG games from a week back to a week ahead (empty until the first answer). */
  games: LiveGame[];
  liveGames: LiveGame[];
}

const EMPTY: LiveContextValue = { games: [], liveGames: [] };
const LiveContext = createContext<LiveContextValue>(EMPTY);

const SUMMARY_URL = "/api/live";
/** Keeps the first paint free of the extra request. */
const FIRST_POLL_DELAY_MS = 1_500;
const MIN_DELAY_MS = 10_000;
const MAX_DELAY_MS = 10 * 60_000;
const ERROR_BACKOFF_START_MS = 30_000;
/** Returning to a tab refreshes immediately if the data is older than this. */
const STALE_AFTER_MS = 20_000;

function isSummary(value: unknown): value is LiveSummary {
  if (typeof value !== "object" || value === null) return false;
  const { games, pollAfterMs } = value as Partial<LiveSummary>;
  return Array.isArray(games) && typeof pollAfterMs === "number";
}

const clampDelay = (ms: number) => Math.min(MAX_DELAY_MS, Math.max(MIN_DELAY_MS, ms));

/**
 * Polls the cached /api/live endpoint at the pace the server asks for (every
 * 15 s while a game is live, every 10 min on quiet days), pauses in background
 * tabs and backs off when the service is unreachable.
 */
export function LiveProvider({ children }: { children: React.ReactNode }) {
  const [games, setGames] = useState<LiveGame[]>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    let failures = 0;
    let lastSuccess = 0;
    let stopped = false;

    const schedule = (delay: number) => {
      clearTimeout(timer);
      if (!stopped) timer = setTimeout(poll, delay);
    };

    async function poll() {
      if (document.hidden) return; // resumed by the visibilitychange handler
      controller?.abort();
      controller = new AbortController();
      try {
        const res = await fetch(SUMMARY_URL, { signal: controller.signal, cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: unknown = await res.json();
        if (!isSummary(data)) throw new Error("Unexpected payload");
        failures = 0;
        lastSuccess = Date.now();
        setGames(data.games);
        schedule(clampDelay(data.pollAfterMs));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        failures++;
        schedule(clampDelay(ERROR_BACKOFF_START_MS * 2 ** (failures - 1)));
      }
    }

    const onVisibility = () => {
      if (document.hidden) {
        clearTimeout(timer);
        controller?.abort();
      } else if (Date.now() - lastSuccess > STALE_AFTER_MS) {
        schedule(0);
      } else {
        schedule(MIN_DELAY_MS);
      }
    };

    schedule(FIRST_POLL_DELAY_MS);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const value = useMemo<LiveContextValue>(
    () => ({ games, liveGames: games.filter((g) => g.live) }),
    [games],
  );
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLiveGames(): LiveContextValue {
  return useContext(LiveContext);
}
