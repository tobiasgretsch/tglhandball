/** Pure helpers behind the match-flow chart: score lead over time, event categories, dot packing. */
import type { EntryKind, TickerEntry } from "./types";

export type EventCategory = "goals" | "penalties" | "timeouts" | "other";

const CATEGORY_BY_KIND: Partial<Record<EntryKind, EventCategory>> = {
  goal: "goals",
  "seven-meter-goal": "goals",
  "own-goal": "goals",
  "time-penalty": "penalties",
  warning: "penalties",
  disqualification: "penalties",
  timeout: "timeouts",
  "seven-meter-miss": "other",
  "team-penalty": "other",
};

/** `null` for period dividers, which are not events of their own. */
export function eventCategory(kind: EntryKind): EventCategory | null {
  return CATEGORY_BY_KIND[kind] ?? null;
}

const SECONDS_PER_MINUTE = 60;
const HALVES = 2;
const TICK_STEPS_MINUTES = [5, 10, 15, 30] as const;
const MAX_TICKS = 8;

export interface LeadStep {
  second: number;
  /** Home goals minus guest goals right after this second. */
  lead: number;
  scoreHome: number;
  scoreGuest: number;
}

/** Score lead after every goal, oldest first, starting at 0:0. `entriesNewestFirst` is the feed order. */
export function buildLeadSteps(entriesNewestFirst: TickerEntry[]): LeadStep[] {
  const steps: LeadStep[] = [{ second: 0, lead: 0, scoreHome: 0, scoreGuest: 0 }];
  for (let i = entriesNewestFirst.length - 1; i >= 0; i--) {
    const entry = entriesNewestFirst[i];
    if (eventCategory(entry.kind) !== "goals") continue;
    // Seconds never run backwards, even if the score sheet is sloppy.
    const second = Math.max(entry.second, steps[steps.length - 1].second);
    steps.push({ second, lead: entry.scoreHome - entry.scoreGuest, scoreHome: entry.scoreHome, scoreGuest: entry.scoreGuest });
  }
  return steps;
}

/** Seconds the x-axis spans: a full game, longer when extra time was played. */
export function chartLengthSeconds(halftimeMinutes: number, entriesNewestFirst: TickerEntry[]): number {
  const regulation = halftimeMinutes * HALVES * SECONDS_PER_MINUTE;
  const latest = entriesNewestFirst.reduce((max, e) => Math.max(max, e.second), 0);
  return Math.max(regulation, latest);
}

/** Minute marks for the x-axis: the smallest step that keeps the labels from crowding. */
export function axisTicksMinutes(lengthSeconds: number): number[] {
  const totalMinutes = Math.ceil(lengthSeconds / SECONDS_PER_MINUTE);
  const step = TICK_STEPS_MINUTES.find((s) => totalMinutes / s <= MAX_TICKS) ?? TICK_STEPS_MINUTES[TICK_STEPS_MINUTES.length - 1];
  const ticks: number[] = [];
  for (let minute = 0; minute <= totalMinutes; minute += step) ticks.push(minute);
  return ticks;
}

/**
 * Lane per event so dots that would overlap on screen stack instead.
 * `seconds` ascending; `secondsPerPx` and `dotPx` come from the measured chart width.
 */
export function assignLanes(seconds: number[], secondsPerPx: number, dotPx: number): number[] {
  const laneRightEdges: number[] = [];
  return seconds.map((second) => {
    const x = second / secondsPerPx;
    const free = laneRightEdges.findIndex((edge) => x - edge >= dotPx);
    const lane = free === -1 ? laneRightEdges.length : free;
    laneRightEdges[lane] = x;
    return lane;
  });
}

/** The step in force at `second` (the last goal at or before it). `steps` ascending, starting at 0. */
export function stepAt(steps: LeadStep[], second: number): LeadStep {
  let current = steps[0];
  for (const step of steps) {
    if (step.second > second) break;
    current = step;
  }
  return current;
}

const MAX_LEAD_LABELS_PER_SIDE = 3;

/** Goal-difference values for the y-axis: 0 and symmetric whole-goal marks up to `scale`. */
export function leadAxisValues(scale: number): number[] {
  const top = Math.floor(scale);
  const step = Math.ceil(top / MAX_LEAD_LABELS_PER_SIDE);
  const values = [0];
  for (let v = step; v <= top; v += step) values.push(v, -v);
  return values.sort((a, b) => b - a);
}
