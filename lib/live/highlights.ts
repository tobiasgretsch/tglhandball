/** Tags that make a finished game worth a look. Pure and client-safe. */
import type { TickerSnapshot } from "./types";

export type Highlight = "krimi" | "comeback" | "kantersieg";

export const HIGHLIGHTS: readonly Highlight[] = ["krimi", "comeback", "kantersieg"];

/** Decided by this many goals or fewer. */
const KRIMI_MAX_MARGIN = 2;
/** The winner won by at least this many goals. */
const BLOWOUT_MIN_MARGIN = 10;
/** The winner was once behind by at least this many goals. */
const COMEBACK_MIN_DEFICIT = 4;

export const isHighlight = (value: string): value is Highlight => (HIGHLIGHTS as readonly string[]).includes(value);

export function deriveHighlights(snapshot: Pick<TickerSnapshot, "scoreHome" | "scoreGuest" | "stats">): Highlight[] {
  const { scoreHome, scoreGuest, stats } = snapshot;
  const margin = Math.abs(scoreHome - scoreGuest);
  const tags: Highlight[] = [];

  if (margin <= KRIMI_MAX_MARGIN) tags.push("krimi");
  if (margin >= BLOWOUT_MIN_MARGIN) tags.push("kantersieg");
  if (margin > 0) {
    const loser = scoreHome > scoreGuest ? stats.guest : stats.home;
    if (loser.biggestLead >= COMEBACK_MIN_DEFICIT) tags.push("comeback");
  }
  return tags;
}
