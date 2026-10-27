import type { Match } from "@/types";

/** Parses "28:24" → [28, 24]; null when the string isn't a score. */
export function parseResult(result: string): [number, number] | null {
  const match = result.trim().match(/^(\d+)\s*:\s*(\d+)$/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2])];
}

/** A game that kicked off this recently may still be under way, so "upcoming" lists keep it until its result lands. */
const MATCH_GRACE_MS = 3 * 60 * 60 * 1000;

/** True once kick-off has passed — the game is under way or over, even if its result is not in yet. */
export function hasKickedOff(date: string): boolean {
  return new Date(date).getTime() <= Date.now();
}

/** ISO start of the "upcoming" window: the fixtures that kicked off since then still count as upcoming. */
export function upcomingSince(): string {
  return new Date(Date.now() - MATCH_GRACE_MS).toISOString();
}

export type Outcome = "sieg" | "niederlage" | "unentschieden";

/** Result from the TG's point of view; null when unknown or not a score. */
export function tgOutcome(match: Match): Outcome | null {
  if (!match.result || match.isHomeGame === undefined) return null;
  const score = parseResult(match.result);
  if (!score) return null;
  const [home, away] = score;
  if (home === away) return "unentschieden";
  const tgWon = match.isHomeGame ? home > away : away > home;
  return tgWon ? "sieg" : "niederlage";
}

export const OUTCOME_LABEL: Record<Outcome, string> = {
  sieg: "Sieg",
  niederlage: "Niederlage",
  unentschieden: "Unentschieden",
};

/** Path of the permanent game page; `null` while the game has none. */
export function gamePagePath(match: Pick<Match, "meetingId" | "archive">): string | null {
  return match.meetingId && match.archive ? `/spielplan/${match.meetingId}` : null;
}
