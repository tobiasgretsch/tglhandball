/** Assembles the full ticker for one game: meeting + events + player names. */
import { coalesce, withStaleFallback } from "./coalesce";
import { buildEntries, deriveScore, deriveStatus } from "./events";
import { isClubTeam } from "./fixture";
import { isValidMeetingId } from "./parse";
import { buildStats } from "./stats";
import { fetchTableFor } from "./table";
import { getLiveSummary } from "./schedule";
import type { TickerSnapshot } from "./types";
import { fetchEvents, fetchGroupName, fetchMeeting, fetchPlayers } from "./upstream";

const TICKER_TTL_MS = 4_000;

async function buildTicker(meetingId: string): Promise<TickerSnapshot | null> {
  const meeting = await fetchMeeting(meetingId);
  // Only our own games: keeps this from becoming an open proxy for all of nuLiga.
  if (!meeting || !(isClubTeam(meeting.homeTeam) || isClubTeam(meeting.awayTeam))) return null;

  const [events, players, league, table] = await Promise.all([
    fetchEvents(meetingId, meeting.versionUid),
    // Names and shirt numbers are a nicety — the ticker works without them.
    fetchPlayers(meetingId).catch(() => []),
    fetchGroupName(meeting.groupId).catch(() => ""),
    // Likewise optional: a missing table just hides the standings line.
    fetchTableFor(meeting.groupId, meeting.homeTeam, meeting.awayTeam).catch(() => undefined),
  ]);

  const game = { ...meeting, league };
  const now = Date.now();
  const { status, label } = deriveStatus(game, events, now);
  const score = deriveScore(game, events);
  const entries = buildEntries(game, events, players);

  return {
    game,
    status,
    statusLabel: label,
    scoreHome: score.home,
    scoreGuest: score.guest,
    entries,
    stats: buildStats(entries, game.homeTeam, game.awayTeam, players),
    table,
    updatedAt: now,
  };
}

/**
 * `null` when the id is unknown or not a TG game. Throws `UpstreamError` when
 * nuLiga is unreachable and there is no earlier snapshot to fall back on.
 */
export async function getTicker(meetingId: string): Promise<{ snapshot: TickerSnapshot; stale: boolean } | null> {
  if (!isValidMeetingId(meetingId)) return null;
  // Unknown ids are rejected from our own (cached) game list without touching nuLiga.
  const { games } = await getLiveSummary();
  if (!games.some((g) => g.meetingId === meetingId)) return null;

  const result = await coalesce(`ticker:${meetingId}`, TICKER_TTL_MS, () =>
    withStaleFallback(`ticker:${meetingId}`, async () => buildTicker(meetingId)),
  );
  return result.value ? { snapshot: result.value, stale: result.stale } : null;
}
