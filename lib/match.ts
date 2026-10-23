import type { Match } from "@/types";

/** Parses "28:24" → [28, 24]; null when the string isn't a score. */
export function parseResult(result: string): [number, number] | null {
  const match = result.trim().match(/^(\d+)\s*:\s*(\d+)$/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2])];
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
