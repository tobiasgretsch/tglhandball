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

const LOOKBACK_MS = 7 * DAY_MS;
const LOOKAHEAD_MS = 7 * DAY_MS;
const HOT_BEFORE_MS = 45 * MINUTE_MS;
const HOT_AFTER_MS = 4 * HOUR_MS;
const SOON_MS = 6 * HOUR_MS;
const GROUP_CONCURRENCY = 6;
const SUMMARY_TTL_MS = 5_000;
/** A cold read of every group must answer well inside the serverless time limit, even when nuLiga hangs. */
const READ_BUDGET_MS = 8_000;
/** This many group reads failing before any succeeds means nuLiga is down: stop asking. */
const GIVE_UP_AFTER_FAILURES = GROUP_CONCURRENCY;
/** After giving up, serve the last known games for this long before trying nuLiga again. */
const DOWN_BACKOFF_MS = 30_000;

const POLL_LIVE_MS = 15_000;
const POLL_HOT_MS = 30_000;
const POLL_SOON_MS = 2 * MINUTE_MS;
const POLL_IDLE_MS = 10 * MINUTE_MS;
/** While nuLiga is unreachable, check back often enough to notice it coming back. */
const POLL_DOWN_MS = MINUTE_MS;

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

/**
 * Runs `task` over `items` with a bounded number in flight; failed items are returned, not thrown.
 * Once `shouldStop` says so, the items not yet started count as failed.
 */
async function mapSettled<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>,
  shouldStop: () => boolean = () => false,
): Promise<{ results: R[]; failed: T[] }> {
  const results: R[] = [];
  const failed: T[] = [];
  let next = 0;
  const worker = async () => {
    while (next < items.length && !shouldStop()) {
      const item = items[next++];
      try {
        results.push(await task(item));
      } catch {
        failed.push(item);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  failed.push(...items.slice(next));
  return { results, failed };
}

async function loadGames(groups: ClubGroup[], mode: "slow" | "fast", deadline: number) {
  let succeeded = 0;
  let failures = 0;
  const { results, failed } = await mapSettled(
    groups,
    GROUP_CONCURRENCY,
    async (g) => {
      try {
        const games = await fetchGroupMeetings(g, mode);
        succeeded++;
        return games;
      } catch (error) {
        failures++;
        throw error;
      }
    },
    () => Date.now() > deadline || (succeeded === 0 && failures >= GIVE_UP_AFTER_FAILURES),
  );
  return { games: results.flat().filter(isClubGame), failed, succeeded };
}

/** The last games we knew per meeting — bridges a failed fast read so a live badge does not flicker. */
let previousGames: LiveGame[] = [];

function pollInterval(games: LiveGame[], now: number): number {
  if (games.some((g) => g.live)) return POLL_LIVE_MS;
  if (games.some((g) => isHot(g, now))) return POLL_HOT_MS;
  if (games.some((g) => startsAt(g) > now && startsAt(g) - now <= SOON_MS)) return POLL_SOON_MS;
  return POLL_IDLE_MS;
}

/** Set when nuLiga answered nothing at all; until then `buildSummary` does not ask again. */
let downUntil = 0;

function summaryWhileDown(now: number): LiveSummary {
  const games = previousGames.filter((g) => startsAt(g) >= now - LOOKBACK_MS && startsAt(g) <= now + LOOKAHEAD_MS);
  return { games, pollAfterMs: Math.min(pollInterval(games, now), POLL_DOWN_MS), updatedAt: now, partial: true };
}

/** `null` when the promise fails or takes longer than `ms`. */
async function withinBudget<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(resolve, ms, null));
  return Promise.race([promise.catch(() => null), timeout]);
}

async function buildSummary(now: number): Promise<LiveSummary> {
  if (now < downUntil) return summaryWhileDown(now);

  const deadline = now + READ_BUDGET_MS;
  const groups = await withinBudget(fetchClubGroups(), READ_BUDGET_MS);
  if (!groups) {
    downUntil = Date.now() + DOWN_BACKOFF_MS;
    return summaryWhileDown(now);
  }
  const slow = await loadGames(groups, "slow", deadline);
  if (groups.length > 0 && slow.succeeded === 0) {
    downUntil = Date.now() + DOWN_BACKOFF_MS;
    return summaryWhileDown(now);
  }
  let failures = slow.failed.length;

  const hotGroupIds = new Set(slow.games.filter((g) => isHot(g, now)).map((g) => g.groupId));
  const byId = new Map(slow.games.map((g) => [g.meetingId, g]));

  if (hotGroupIds.size > 0) {
    const fast = await loadGames(
      groups.filter((g) => hotGroupIds.has(g.id)),
      "fast",
      deadline,
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
