/**
 * Links a fixture from our own schedule (Sanity) to a live game. Client-safe.
 * Names are compared loosely because nuLiga is inconsistent ("TG Landshut",
 * "TG Landshut (a.K.)"); the kick-off time then pins the right game down.
 */
import type { LiveGame } from "./types";

export const MAX_KICKOFF_DRIFT_MS = 3 * 60 * 60 * 1000;
const CLUB_NAME = /^tg (?:mipa )?landshut\b/i;

export function normalizeTeamName(name: string): string {
  return name
    .replace(/\([^)]*\)/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/g, " ")
    .trim();
}

export function isClubTeam(name: string): boolean {
  return CLUB_NAME.test(name.trim());
}

interface Fixture {
  homeTeam: string;
  awayTeam: string;
  date: string;
}

export function findGameForFixture(games: LiveGame[], fixture: Fixture): LiveGame | null {
  const kickoff = new Date(fixture.date).getTime();
  if (Number.isNaN(kickoff)) return null;
  const home = normalizeTeamName(fixture.homeTeam);
  const away = normalizeTeamName(fixture.awayTeam);

  let best: { game: LiveGame; drift: number } | null = null;
  for (const game of games) {
    if (normalizeTeamName(game.homeTeam) !== home || normalizeTeamName(game.awayTeam) !== away) continue;
    const drift = Math.abs(new Date(game.scheduled).getTime() - kickoff);
    if (drift > MAX_KICKOFF_DRIFT_MS) continue;
    if (!best || drift < best.drift) best = { game, drift };
  }
  return best?.game ?? null;
}
