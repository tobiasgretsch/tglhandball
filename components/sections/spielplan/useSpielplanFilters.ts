"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { parseFilters, serializeFilters, type SpielplanFilters } from "@/lib/spielplanFilter";

const CHANGE_EVENT = "spielplan:filters";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

const readSearch = () => window.location.search;
/** The server renders the unfiltered list; the URL is applied right after hydration. */
const serverSearch = () => "";

/**
 * Filters live in the URL. `replaceState` keeps typing in the search field from filling the
 * history with entries, and the page stays statically rendered.
 */
export function useSpielplanFilters() {
  const search = useSyncExternalStore(subscribe, readSearch, serverSearch);
  const filters = useMemo(() => parseFilters(search), [search]);

  const update = useCallback((patch: Partial<SpielplanFilters>) => {
    const next = { ...parseFilters(window.location.search), ...patch };
    const query = serializeFilters(next);
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const reset = useCallback(() => {
    window.history.replaceState(null, "", window.location.pathname);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { filters, search, update, reset };
}
