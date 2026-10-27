/**
 * Turns the raw score-sheet event stream into what a ticker shows: a status,
 * the current score and a readable feed. Pure — no I/O, `now` is a parameter.
 */
import type { RawEvent, RawPlayer } from "./parse";
import type { EntryKind, EntryLabel, GameStatus, LiveGame, StatusLabel, TeamSide, TickerEntry } from "./types";

/** Event codes of nuScoreLive (`GAME_TIME_START = 0` … `OFFICIAL_TO_PLAYER_SWITCH = 19`). */
const CODE = {
  interruptionHome: 2,
  interruptionGuest: 3,
  goal: 4,
  sevenMeterGoal: 5,
  sevenMeterMiss: 6,
  ownGoal: 7,
  timePenalty: 8,
  warning: 9,
  disqualificationReport: 10,
  disqualificationNoReport: 11,
  teamPenaltyHome: 12,
  teamPenaltyGuest: 13,
  periodStop: 14,
  periodStart: 15,
  gameEnd: 16,
} as const;

const SCORING_CODES: ReadonlySet<number> = new Set([CODE.goal, CODE.sevenMeterGoal, CODE.ownGoal]);
const PERIOD_CODES: ReadonlySet<number> = new Set([CODE.periodStart, CODE.periodStop, CODE.gameEnd]);
const ANONYMOUS_NAME = "Anonym";
export const REGULAR_PERIODS = 2;
/** A game without "Spielende" this long after kick-off is treated as over. */
const ABANDONED_AFTER_MS = 4 * 60 * 60 * 1000;
const SECONDS_PER_MINUTE = 60;

interface EntryStyle {
  kind: EntryKind;
  label: EntryLabel;
}

const ENTRY_STYLE: Partial<Record<number, EntryStyle>> = {
  [CODE.goal]: { kind: "goal", label: "goal" },
  [CODE.sevenMeterGoal]: { kind: "seven-meter-goal", label: "sevenMeterGoal" },
  [CODE.sevenMeterMiss]: { kind: "seven-meter-miss", label: "sevenMeterMiss" },
  [CODE.ownGoal]: { kind: "own-goal", label: "ownGoal" },
  [CODE.timePenalty]: { kind: "time-penalty", label: "timePenalty" },
  [CODE.warning]: { kind: "warning", label: "warning" },
  [CODE.disqualificationReport]: { kind: "disqualification", label: "disqualificationBlue" },
  [CODE.disqualificationNoReport]: { kind: "disqualification", label: "disqualificationRed" },
  [CODE.interruptionHome]: { kind: "timeout", label: "timeout" },
  [CODE.interruptionGuest]: { kind: "timeout", label: "timeout" },
  [CODE.teamPenaltyHome]: { kind: "team-penalty", label: "teamPenalty" },
  [CODE.teamPenaltyGuest]: { kind: "team-penalty", label: "teamPenalty" },
};

const SIDE_FROM_CODE: Partial<Record<number, TeamSide>> = {
  [CODE.interruptionHome]: "home",
  [CODE.interruptionGuest]: "guest",
  [CODE.teamPenaltyHome]: "home",
  [CODE.teamPenaltyGuest]: "guest",
};

interface PeriodState {
  status: GameStatus;
  label: StatusLabel;
  /** Period a `periodRunning` label refers to; 0 otherwise. */
  period: number;
}

/**
 * The score sheet often logs a period marker twice in a row, and closes the last
 * period right before the game end — both are noise in a feed.
 */
function dedupePeriodEvents(events: RawEvent[]): RawEvent[] {
  return events.filter((e, i) => {
    const prev = events[i - 1];
    const next = events[i + 1];
    const isRepeat = prev && PERIOD_CODES.has(e.code) && prev.code === e.code && prev.second === e.second;
    const closesTheGame = e.code === CODE.periodStop && next?.code === CODE.gameEnd;
    return !isRepeat && !closesTheGame;
  });
}

export function deriveStatus(
  game: Pick<LiveGame, "live" | "scheduled">,
  events: RawEvent[],
  now: number,
): PeriodState {
  const periodEvents = dedupePeriodEvents(events.filter((e) => PERIOD_CODES.has(e.code)));
  const last = periodEvents.at(-1);
  const stops = periodEvents.filter((e) => e.code === CODE.periodStop).length;

  if (last?.code === CODE.gameEnd) return { status: "finished", label: "finished", period: 0 };

  const overdue = now - new Date(game.scheduled).getTime() > ABANDONED_AFTER_MS;
  if (!game.live && overdue && events.length > 0) return { status: "finished", label: "finished", period: 0 };

  if (last?.code === CODE.periodStart) {
    return { status: "running", label: "periodRunning", period: stops + 1 };
  }
  if (last?.code === CODE.periodStop) {
    const label: StatusLabel =
      stops === 1 ? "halftimeBreak" : stops === REGULAR_PERIODS ? "regularTimeEnd" : "break";
    return { status: "break", label, period: 0 };
  }
  if (game.live || events.length > 0) return { status: "running", label: "running", period: 0 };
  return { status: "scheduled", label: "notStarted", period: 0 };
}

/** Scores only grow, so the larger total is the fresher one. */
export function deriveScore(
  game: Pick<LiveGame, "scoreHome" | "scoreGuest">,
  events: RawEvent[],
): { home: number; guest: number } {
  const lastScoring = events.findLast((e) => SCORING_CODES.has(e.code));
  const fromEvents = lastScoring
    ? { home: lastScoring.pointsHome, guest: lastScoring.pointsGuest }
    : { home: 0, guest: 0 };
  const fromMeeting = { home: game.scoreHome, guest: game.scoreGuest };
  return fromEvents.home + fromEvents.guest >= fromMeeting.home + fromMeeting.guest
    ? fromEvents
    : fromMeeting;
}

/** "#7 Nicolas Schühle"; falls back to the name alone when there is no shirt number. */
export function playerLabel(number: string, firstName: string, lastName: string): string {
  const name = [firstName, lastName].filter(Boolean).join(" ");
  return number ? `#${number} ${name}`.trim() : name;
}

function playerLine(event: RawEvent, players: Map<string, RawPlayer>): string {
  const known = event.meetingPersonId ? players.get(event.meetingPersonId) : undefined;
  const lastName = known?.lastName || event.lastName || "";
  const firstName = known?.firstName || event.firstName || "";
  if (!lastName || lastName === ANONYMOUS_NAME) return known?.number ? `#${known.number}` : "";
  return playerLabel(known?.number ?? "", firstName, lastName);
}

function sideOf(event: RawEvent, previousScore: RawEvent | undefined): TeamSide | null {
  const fixed = SIDE_FROM_CODE[event.code];
  if (fixed) return fixed;
  if (SCORING_CODES.has(event.code)) {
    // The score delta is authoritative; the `teamHome` flag is not reliable for own goals.
    const before = previousScore ?? { pointsHome: 0, pointsGuest: 0 };
    if (event.pointsHome > before.pointsHome) return "home";
    if (event.pointsGuest > before.pointsGuest) return "guest";
  }
  if (event.teamHome === null) return null;
  return event.teamHome ? "home" : "guest";
}

function periodLabel(events: RawEvent[], at: number): { label: EntryLabel; period: number } {
  const event = events[at];
  const n = events.slice(0, at + 1).filter((e) => e.code === event.code).length;
  if (event.code === CODE.gameEnd) return { label: "gameEnd", period: 0 };
  if (event.code === CODE.periodStart) {
    return n === 1 ? { label: "kickoff", period: 0 } : { label: "periodStart", period: n };
  }
  if (n === 1) return { label: "halftime", period: 0 };
  return n === REGULAR_PERIODS ? { label: "regularTimeEnd", period: 0 } : { label: "extraTimeEnd", period: n };
}

function teamName(game: LiveGame, side: TeamSide | null): string {
  if (side === "home") return game.homeTeam;
  if (side === "guest") return game.awayTeam;
  return "";
}

/** Newest first. Clock ticks, unknown codes and duplicate period markers are dropped. */
export function buildEntries(
  game: LiveGame,
  rawEvents: RawEvent[],
  players: RawPlayer[],
): TickerEntry[] {
  const events = dedupePeriodEvents(rawEvents);
  const playerById = new Map(players.map((p) => [p.meetingPersonId, p]));
  const entries: TickerEntry[] = [];
  let previousScore: RawEvent | undefined;

  events.forEach((event, i) => {
    const base = {
      idx: event.idx,
      second: event.second,
      scoreHome: event.pointsHome,
      scoreGuest: event.pointsGuest,
    };
    if (PERIOD_CODES.has(event.code)) {
      entries.push({ ...base, kind: "period", ...periodLabel(events, i), detail: "", side: null });
      return;
    }
    const style = ENTRY_STYLE[event.code];
    if (!style) return;

    const side = sideOf(event, previousScore);
    if (SCORING_CODES.has(event.code)) previousScore = event;
    const isTeamEvent = style.kind === "timeout" || style.kind === "team-penalty";
    const detail = isTeamEvent
      ? teamName(game, side)
      : playerLine(event, playerById) || teamName(game, side);
    entries.push({ ...base, ...style, period: 0, detail, side });
  });

  return entries.reverse();
}

/** "12:34" — game clock position of an event. */
export function formatGameClock(second: number): string {
  const minutes = Math.floor(second / SECONDS_PER_MINUTE);
  const rest = second % SECONDS_PER_MINUTE;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
