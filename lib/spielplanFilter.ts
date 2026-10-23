/**
 * Filter state of the Spielplan, kept in the URL (`?team=…&ergebnis=sieg`) so a view can be
 * shared and survives the back button. Pure and client-safe — no React in here.
 */
import { CLUB_TIME_ZONE } from "@/lib/dates";
import { isHighlight, type Highlight } from "@/lib/live/highlights";
import { normalizeTeamName } from "@/lib/live/fixture";
import { parseResult, tgOutcome, type Outcome } from "@/lib/match";
import type { Match } from "@/types";

export type Ort = "heim" | "auswaerts";
export type Status = "live" | "kommend" | "beendet";

export interface SpielplanFilters {
  /** Slug of the TG team. */
  team: string | null;
  /** First year of the season (2026 = 2026/27); `null` = the current season. */
  saison: number | null;
  /** "2026-10" */
  monat: string | null;
  ort: Ort | null;
  ergebnis: Outcome | null;
  liga: string | null;
  status: Status | null;
  tag: Highlight | null;
  /** Free text, matched against both team names. */
  q: string;
}

export const EMPTY_FILTERS: SpielplanFilters = {
  team: null,
  saison: null,
  monat: null,
  ort: null,
  ergebnis: null,
  liga: null,
  status: null,
  tag: null,
  q: "",
};

/** The season starts in July, after the last league games. */
const SEASON_START_MONTH = 7;
const MAX_QUERY_LENGTH = 40;
const FORM_LENGTH = 5;

const OUTCOMES: readonly Outcome[] = ["sieg", "unentschieden", "niederlage"];
const STATUSES: readonly Status[] = ["live", "kommend", "beendet"];
const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/;

const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: CLUB_TIME_ZONE });

/** "2026-10-17" in club time. */
const dayKey = (iso: string) => dayFormat.format(new Date(iso));

export const monthKey = (iso: string) => dayKey(iso).slice(0, 7);

export function seasonOf(iso: string): number {
  const [year, month] = dayKey(iso).split("-").map(Number);
  return month >= SEASON_START_MONTH ? year : year - 1;
}

export const seasonLabel = (season: number) => `${season}/${String((season + 1) % 100).padStart(2, "0")}`;

function pick<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return allowed.find((candidate) => candidate === value) ?? null;
}

export function parseFilters(search: string): SpielplanFilters {
  const params = new URLSearchParams(search);
  const saison = Number(params.get("saison"));
  const monat = params.get("monat");
  const tag = params.get("tag");
  return {
    team: params.get("team") || null,
    saison: Number.isInteger(saison) && saison > 2000 ? saison : null,
    monat: monat && MONTH_KEY.test(monat) ? monat : null,
    ort: pick(params.get("ort"), ["heim", "auswaerts"] as const),
    ergebnis: pick(params.get("ergebnis"), OUTCOMES),
    liga: params.get("liga") || null,
    status: pick(params.get("status"), STATUSES),
    tag: tag && isHighlight(tag) ? tag : null,
    q: (params.get("q") ?? "").slice(0, MAX_QUERY_LENGTH),
  };
}

/** Query string without the leading `?`; defaults are left out. */
export function serializeFilters(filters: SpielplanFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== null && value !== "") params.set(key, String(value));
  }
  return params.toString();
}

/** Filters beyond the always-visible team pills — what the "Filter" button counts. */
export function countDetailFilters(filters: SpielplanFilters): number {
  const { monat, ort, ergebnis, liga, status, tag } = filters;
  return [monat, ort, ergebnis, liga, status, tag].filter(Boolean).length;
}

export const hasAnyFilter = (filters: SpielplanFilters) => serializeFilters(filters) !== "";

interface FilterContext {
  currentSeason: number;
  isLive: (match: Match) => boolean;
}

/** `skip` leaves one dimension out, so its own option list is not narrowed by the current choice. */
export function matchesFilters(
  match: Match,
  filters: SpielplanFilters,
  { currentSeason, isLive }: FilterContext,
  skip: ReadonlyArray<keyof SpielplanFilters> = [],
): boolean {
  const active = (key: keyof SpielplanFilters) => !skip.includes(key);
  const f = filters;

  if (active("team") && f.team && match.team?.slug?.current !== f.team) return false;
  if (active("saison") && seasonOf(match.date) !== (f.saison ?? currentSeason)) return false;
  if (active("monat") && f.monat && monthKey(match.date) !== f.monat) return false;
  if (active("ort") && f.ort && match.isHomeGame !== (f.ort === "heim")) return false;
  if (active("ergebnis") && f.ergebnis && tgOutcome(match) !== f.ergebnis) return false;
  if (active("liga") && f.liga && match.league !== f.liga) return false;
  if (active("tag") && f.tag && !match.archive?.highlights?.includes(f.tag)) return false;
  if (active("status") && f.status) {
    if (f.status === "live" && !isLive(match)) return false;
    if (f.status === "kommend" && match.result) return false;
    if (f.status === "beendet" && !match.result) return false;
  }
  if (active("q") && f.q.trim()) {
    const needle = normalizeTeamName(f.q);
    const haystack = normalizeTeamName(`${match.homeTeam} ${match.awayTeam}`);
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

export interface Balance {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  /** Oldest → newest, at most five. */
  form: Outcome[];
}

/** Record of the TG teams over the given results (any order). */
export function balanceOf(results: Match[]): Balance {
  const chronological = [...results].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const balance: Balance = { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, form: [] };
  const outcomes: Outcome[] = [];

  for (const match of chronological) {
    const outcome = tgOutcome(match);
    const score = match.result ? parseResult(match.result) : null;
    if (!outcome || !score) continue;
    outcomes.push(outcome);
    if (outcome === "sieg") balance.wins++;
    else if (outcome === "unentschieden") balance.draws++;
    else balance.losses++;
    const [home, away] = score;
    balance.goalsFor += match.isHomeGame ? home : away;
    balance.goalsAgainst += match.isHomeGame ? away : home;
  }
  balance.form = outcomes.slice(-FORM_LENGTH);
  return balance;
}
