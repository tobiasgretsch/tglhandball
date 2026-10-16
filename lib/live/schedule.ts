/**
 * Which TG games exist around now, and which of them are live.
 *
 * Two tiers keep the load on nuLiga small:
 *  - slow: every group the club plays in, cached for ten minutes
 *  - fast: only groups with a game in its "hot" window, re-read every 15 s
 */
import { coalesce, withStaleFallback } from "./coalesce";
import { isClubTeam } from "./fixture";
import type { ClubGroup } from "./parse";
import { fetchClubGroups, fetchGroupMeetings } from "./upstream";
import type { LiveGame, LiveSummary } from "./types";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const LOOKBACK_MS = 3 * DAY_MS;
const LOOKAHEAD_MS = 7 * DAY_MS;
const HOT_BEFORE_MS = 45 * MINUTE_MS;
const HOT_AFTER_MS = 4 * HOUR_MS;
const SOON_MS = 6 * HOUR_MS;
const GROUP_CONCURRENCY = 6;
const SUMMARY_TTL_MS = 5_000;

const POLL_LIVE_MS = 15_000;
const POLL_HOT_MS = 30_000;
const POLL_SOON_MS = 2 * MINUTE_MS;
const POLL_IDLE_MS = 10 * MINUTE_MS;

/** Tournament days appear as placeholder fixtures ("Spieltag …") that are never scored live. */
const TOURNAMENT_PLACEHOLDER = /^spieltag/i;

const isClubGame = (game: LiveGame) =>
  (isClubTeam(game.homeTeam) || isClubTeam(game.awayTeam)) &&
  !TOURNAMENT_PLACEHOLDER.test(game.homeTeam) &&
  !TOURNAMENT_PLACEHOLDER.test(game.awayTeam);
const startsAt = (game: LiveGame) => new Date(game.scheduled).getTime();

function isHot(game: LiveGame, now: number): boolean {
  const start = startsAt(game);
  return game.live || (now >= start - HOT_BEFORE_MS && now <= start + HOT_AFTER_MS);
}

/** Runs `task` over `items` with a bounded number in flight; failed items are returned, not thrown. */
async function mapSettled<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<{ results: R[]; failed: T[] }> {
  const results: R[] = [];
  const failed: T[] = [];
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const item = items[next++];
      try {
        results.push(await task(item));
      } catch {
        failed.push(item);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return { results, failed };
}

async function loadGames(groups: ClubGroup[], mode: "slow" | "fast") {
  const { results, failed } = await mapSettled(groups, GROUP_CONCURRENCY, (g) => fetchGroupMeetings(g, mode));
  return { games: results.flat().filter(isClubGame), failed };
}

/** The last games we knew per meeting — bridges a failed fast read so a live badge does not flicker. */
let previousGames: LiveGame[] = [];

export function pollInterval(games: LiveGame[], now: number): number {
  if (games.some((g) => g.live)) return POLL_LIVE_MS;
  if (games.some((g) => isHot(g, now))) return POLL_HOT_MS;
  if (games.some((g) => startsAt(g) > now && startsAt(g) - now <= SOON_MS)) return POLL_SOON_MS;
  return POLL_IDLE_MS;
}

async function buildSummary(now: number): Promise<LiveSummary> {
  const groups = await fetchClubGroups();
  const slow = await loadGames(groups, "slow");
  let failures = slow.failed.length;

  const hotGroupIds = new Set(slow.games.filter((g) => isHot(g, now)).map((g) => g.groupId));
  const byId = new Map(slow.games.map((g) => [g.meetingId, g]));

  if (hotGroupIds.size > 0) {
    const fast = await loadGames(
      groups.filter((g) => hotGroupIds.has(g.id)),
      "fast",
    );
    failures += fast.failed.length;
    for (const game of fast.games) byId.set(game.meetingId, game);

    const failedIds = new Set(fast.failed.map((g) => g.id));
    for (const game of previousGames) {
      if (failedIds.has(game.groupId)) byId.set(game.meetingId, game);
    }
  }

  const games = [...byId.values()]
    .filter((g) => startsAt(g) >= now - LOOKBACK_MS && startsAt(g) <= now + LOOKAHEAD_MS)
    .sort((a, b) => startsAt(a) - startsAt(b));
  previousGames = games;

  return { games, pollAfterMs: pollInterval(games, now), updatedAt: now, partial: failures > 0 };
}

/** Throws only when nothing at all could be loaded and no earlier result exists. */
export function getLiveSummary(): Promise<LiveSummary> {
  return coalesce("summary", SUMMARY_TTL_MS, async () => {
    const { value } = await withStaleFallback("summary", () => buildSummary(Date.now()));
    return value;
  });
}
