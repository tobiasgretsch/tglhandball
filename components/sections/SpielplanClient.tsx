"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ListOrdered, Search, SlidersHorizontal, X } from "lucide-react";
import type { Match } from "@/types";
import { CLUB_TIME_ZONE } from "@/lib/dates";
import { findGameForFixture } from "@/lib/live/fixture";
import {
  balanceOf,
  countDetailFilters,
  hasAnyFilter,
  matchesFilters,
  monthKey,
  seasonOf,
} from "@/lib/spielplanFilter";
import FilterPill from "@/components/ui/FilterPill";
import { useLiveGames } from "@/components/live/LiveProvider";
import SpielplanFilterSheet from "./spielplan/SpielplanFilterSheet";
import SpielplanMatchRow from "./spielplan/SpielplanMatchRow";
import SpielplanSummary from "./spielplan/SpielplanSummary";
import { useSpielplanFilters } from "./spielplan/useSpielplanFilters";

interface TeamOption {
  _id: string;
  name: string;
  slug: string;
  hasTable: boolean;
}

interface SpielplanClientProps {
  matches: Match[];
  teams: TeamOption[];
  /** Season (first year) of "today", decided on the server so the first paint is the same everywhere. */
  currentSeason: number;
}

interface DayGroup {
  /** Calendar day in club time zone, e.g. "2026-10-17" — stable grouping key. */
  key: string;
  label: string;
  matches: Match[];
}

/** Rows shown per section before "Alle anzeigen" — keeps a long season light on phones. */
const INITIAL_ROWS = 20;

/** With a team chosen, only the next games matter; the rest of the season stays collapsed. */
const INITIAL_ROWS_TEAM_UPCOMING = 2;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: CLUB_TIME_ZONE });

const dayLabelFormat = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: CLUB_TIME_ZONE,
});

const monthLabelFormat = new Intl.DateTimeFormat("de-DE", {
  month: "short",
  year: "2-digit",
  timeZone: CLUB_TIME_ZONE,
});

/** "2026-10" → "Okt. 26" (noon on the 15th is the same month in every time zone). */
const monthLabel = (key: string) => monthLabelFormat.format(new Date(`${key}-15T12:00:00Z`));

/** Groups already-sorted matches by calendar day, preserving order. */
function groupByDay(matches: Match[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const match of matches) {
    const date = new Date(match.date);
    const key = dayKeyFormat.format(date);
    const last = groups[groups.length - 1];
    if (last?.key === key) {
      last.matches.push(match);
    } else {
      groups.push({ key, label: dayLabelFormat.format(date), matches: [match] });
    }
  }
  return groups;
}

const unique = <T,>(values: Array<T | undefined>): T[] => [...new Set(values.filter((v): v is T => v !== undefined))];

// ─── Main component ───────────────────────────────────────────────────────────

export default function SpielplanClient({ matches, teams, currentSeason }: SpielplanClientProps) {
  const { filters, search, update, reset } = useSpielplanFilters();
  const { liveGames } = useLiveGames();
  const [panelOpen, setPanelOpen] = useState(false);

  const context = useMemo(() => {
    const liveIds = new Set(matches.filter((m) => findGameForFixture(liveGames, m)).map((m) => m._id));
    return { currentSeason, isLive: (match: Match) => liveIds.has(match._id) };
  }, [matches, liveGames, currentSeason]);

  const filtered = useMemo(
    () => matches.filter((m) => matchesFilters(m, filters, context)),
    [matches, filters, context],
  );
  const upcoming = useMemo(() => filtered.filter((m) => !m.result), [filtered]);
  const results = useMemo(
    () =>
      filtered
        .filter((m) => Boolean(m.result))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filtered],
  );

  // Option lists come from the games of the chosen team and season, so a chip never leads to an empty list.
  const scope = useMemo(
    () =>
      matches.filter((m) =>
        matchesFilters(m, filters, context, ["monat", "ort", "ergebnis", "liga", "status", "tag", "q"]),
      ),
    [matches, filters, context],
  );
  const months = useMemo(
    () => unique(scope.map((m) => monthKey(m.date))).sort().map((key) => ({ key, label: monthLabel(key) })),
    [scope],
  );
  const leagues = useMemo(() => unique(scope.map((m) => m.league)).sort(), [scope]);
  const seasons = useMemo(
    () =>
      unique(
        matches
          .filter((m) => matchesFilters(m, filters, context, ["saison", "monat", "ort", "ergebnis", "liga", "status", "tag", "q"]))
          .map((m) => seasonOf(m.date)),
      ).sort((a, b) => b - a),
    [matches, filters, context],
  );
  const balance = useMemo(() => balanceOf(results), [results]);

  const selectedTeam = teams.find((team) => team.slug === filters.team);
  const detailCount = countDetailFilters(filters);
  const nothingFound = upcoming.length === 0 && results.length === 0;

  return (
    <div className="bg-background dark:bg-gray-900 min-h-[60vh]">
      {/* ── Team bar ─────────────────────────────────────────────────── */}
      <div className="material-bar sticky top-[54px] lg:top-[60px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="scroll-fade-x flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5 pr-8">
            <FilterPill
              label="Alle Teams"
              active={filters.team === null}
              onClick={() => update({ team: null, liga: null })}
            />
            {teams.map((team) => (
              <FilterPill
                key={team._id}
                label={team.name}
                active={filters.team === team.slug}
                onClick={() => update({ team: filters.team === team.slug ? null : team.slug, liga: null })}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        {/* ── Search and filters ───────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Gegner suchen</span>
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                value={filters.q}
                onChange={(event) => update({ q: event.target.value })}
                placeholder="Gegner suchen …"
                autoComplete="off"
                className="min-h-11 w-full rounded-full border border-gray-200 bg-white py-2 pl-10 pr-4 text-base text-text placeholder:text-muted dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </label>
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              aria-haspopup="dialog"
              aria-label={detailCount > 0 ? `Filter, ${detailCount} aktiv` : "Filter"}
              className="press relative inline-flex size-11 shrink-0 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white text-sm font-semibold text-text transition-colors hover:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 sm:w-auto sm:px-4"
            >
              <SlidersHorizontal size={18} aria-hidden="true" />
              <span className="hidden sm:inline">Filter</span>
              {detailCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-black text-white sm:static sm:size-5"
                >
                  {detailCount}
                </span>
              )}
            </button>
          </div>

          {(selectedTeam?.hasTable || hasAnyFilter(filters)) && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedTeam?.hasTable && (
                <Link
                  href={`/teams/${selectedTeam.slug}#tabelle`}
                  className="press inline-flex min-h-11 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-text transition-colors hover:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <ListOrdered size={16} aria-hidden="true" />
                  Tabelle {selectedTeam.name}
                </Link>
              )}
              {hasAnyFilter(filters) && (
                <button
                  type="button"
                  onClick={reset}
                  className="press inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-brand-red underline-offset-4 hover:underline"
                >
                  <X size={14} aria-hidden="true" />
                  Zurücksetzen
                </button>
              )}
            </div>
          )}
        </div>

        <SpielplanFilterSheet
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          onReset={reset}
          canReset={hasAnyFilter(filters)}
          resultCount={filtered.length}
          months={months}
          filters={filters}
          onChange={update}
          leagues={leagues}
          seasons={seasons}
          currentSeason={currentSeason}
        />

        {hasAnyFilter(filters) && <SpielplanSummary balance={balance} />}

        {nothingFound ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
            <p className="font-bold text-text dark:text-gray-100">Keine Spiele gefunden.</p>
            <p className="mt-1 text-sm text-muted">
              {hasAnyFilter(filters) ? "Mit diesen Filtern gibt es keine Treffer." : "Es sind noch keine Spiele eingetragen."}
            </p>
            {hasAnyFilter(filters) && (
              <button
                type="button"
                onClick={reset}
                className="press mt-4 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-white hover:bg-primary-light"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-14">
            {upcoming.length > 0 && (
              <MatchSection
                title="Kommende Spiele"
                matches={upcoming}
                isResult={false}
                resetKey={search}
                initialRows={filters.team ? INITIAL_ROWS_TEAM_UPCOMING : INITIAL_ROWS}
              />
            )}
            {results.length > 0 && (
              <MatchSection
                title="Ergebnisse"
                matches={results}
                isResult={true}
                resetKey={search}
                initialRows={INITIAL_ROWS}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function MatchSection({
  title,
  matches,
  isResult,
  resetKey,
  initialRows,
}: {
  title: string;
  matches: Match[];
  isResult: boolean;
  /** Collapses the section again whenever the filters change. */
  resetKey: string;
  /** Rows shown before "Alle anzeigen". */
  initialRows: number;
}) {
  const [expandedFor, setExpandedFor] = useState<string | null>(null);
  const expanded = expandedFor === resetKey;
  const visible = expanded ? matches : matches.slice(0, initialRows);
  const groups = useMemo(() => groupByDay(visible), [visible]);

  return (
    <section aria-label={title}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
        <span
          aria-hidden="true"
          className={`block w-2 h-2 rounded-full shrink-0 ${isResult ? "bg-accent" : "bg-primary"}`}
        />
        <h2 className="font-display font-bold italic uppercase text-2xl md:text-3xl tracking-[-0.02em] text-text dark:text-gray-100">
          {title}
        </h2>
        <span className="text-xs text-muted tabular-nums">{matches.length}</span>
        <span className="inline-flex items-center gap-2 text-xs text-muted sm:ml-auto">
          <span aria-hidden="true" className="block w-1 h-4 rounded-full bg-primary" />
          Heimspiel
        </span>
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.key}>
            <h3 className="px-1 mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">{group.label}</h3>
            <ul className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_16px_40px_-20px_rgb(0_0_0/0.2)] overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
              {group.matches.map((match) => (
                <SpielplanMatchRow key={match._id} match={match} isResult={isResult} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      {!expanded && matches.length > initialRows && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setExpandedFor(resetKey)}
            className="press inline-flex min-h-11 items-center rounded-full border border-gray-200 bg-white px-5 text-sm font-bold text-text transition-colors hover:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            Alle {matches.length} anzeigen
          </button>
        </div>
      )}
    </section>
  );
}
