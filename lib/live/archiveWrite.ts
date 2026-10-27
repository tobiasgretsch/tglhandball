/**
 * Stores finished games permanently in Sanity (`matchArchive`). Server-only.
 * Triggered lazily when someone follows a finished game, and by the nightly cron
 * for everything the ticker window still knows about.
 */
import { revalidatePath, revalidateTag } from "next/cache";
import { client } from "@/lib/sanity";
import { anonymize, archiveTag, isYouthGame } from "./archive";
import { findGameForFixture, MAX_KICKOFF_DRIFT_MS } from "./fixture";
import { deriveHighlights } from "./highlights";
import { getLiveSummary } from "./schedule";
import { deriveSnapshot, fetchRawGame } from "./ticker";
import type { LiveGame } from "./types";

export type ArchiveOutcome = "archived" | "exists" | "unfinished" | "no-events" | "unknown";

const DOC_ID_PREFIX = "matchArchive-";
/** Games usually end within two hours; wait a little longer before the nightly sweep touches them. */
const SWEEP_MIN_AGE_MS = 3 * 60 * 60 * 1000;
const SWEEP_CONCURRENCY = 3;
const SWEEP_MAX_GAMES = 20;
/** nuLiga's group listing drops a game once its group has played a later matchday, so the Spielplan fills the gap. */
const BACKFILL_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;
const SCHEMA_VERSION = 1;
const MINUTE_MS = 60 * 1000;
/** Games that kicked off longer ago are left to the nightly sweep. */
const FINISH_WATCH_MS = 24 * 60 * MINUTE_MS;
const FINISH_RETRY_MS = 5 * MINUTE_MS;
/** For games that will not be archived soon anyway (no score sheet, unknown league): do not ask again every few minutes. */
const GIVE_UP_RETRY_MS = 60 * MINUTE_MS;
const FINISH_CHECKS_PER_CALL = 3;

const docId = (meetingId: string) => `${DOC_ID_PREFIX}${meetingId}`;

/** Ids archived (or confirmed absent of events) by this instance — spares Sanity repeat lookups. */
const settled = new Set<string>();

async function sanityWriter() {
  // Lazy: the write client throws on import when no token is configured.
  return (await import("@/lib/sanity-write")).writeClient;
}

function refreshPages(meetingId: string) {
  try {
    revalidateTag(archiveTag(meetingId), { expire: 0 });
    revalidatePath("/");
    revalidatePath("/spielplan");
    revalidatePath("/teams/[slug]", "page");
  } catch {
    // Outside a request (scripts): nothing cached to refresh.
  }
}

type SanityWriter = Awaited<ReturnType<typeof sanityWriter>>;

interface ScheduledMatch {
  _id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  result?: string;
  meetingId?: string;
  manualOverride?: boolean;
}

const MATCHES_AROUND_QUERY = `*[_type == "match" && date >= $from && date <= $to]{
  _id, homeTeam, awayTeam, date, result, meetingId, manualOverride
}`;

/**
 * Puts the final score (and the game id behind the Verlauf link) on the game's Spielplan entry right away.
 * Otherwise a finished game looks unplayed on the Spielplan, homepage and team pages until the nightly sync,
 * which later replaces the score with nuLiga's official one. Never overwrites a stored result or a manual entry.
 */
async function recordResult(writer: SanityWriter, game: LiveGame, score: string): Promise<void> {
  const kickoff = new Date(game.scheduled).getTime();
  const candidates = await writer.fetch<ScheduledMatch[]>(MATCHES_AROUND_QUERY, {
    from: new Date(kickoff - MAX_KICKOFF_DRIFT_MS).toISOString(),
    to: new Date(kickoff + MAX_KICKOFF_DRIFT_MS).toISOString(),
  });
  const match = candidates.find((candidate) => findGameForFixture([game], candidate));
  if (!match || match.manualOverride) return;

  const fields = {
    ...(match.result ? {} : { result: score }),
    ...(match.meetingId ? {} : { meetingId: game.meetingId }),
  };
  if (Object.keys(fields).length === 0) return;
  await writer.patch(match._id).set(fields).commit();
}

export async function archiveGame(meetingId: string): Promise<ArchiveOutcome> {
  if (settled.has(meetingId)) return "exists";
  const writer = await sanityWriter();
  if (await writer.getDocument(docId(meetingId))) {
    settled.add(meetingId);
    return "exists";
  }

  const raw = await fetchRawGame(meetingId);
  if (!raw) return "unknown";

  // Only a game that is really over. nuLiga's `live` flag can lag the final whistle, so it is ignored here.
  const now = Date.now();
  const snapshot = deriveSnapshot({ ...raw, game: { ...raw.game, live: false } }, now);
  if (snapshot.status !== "finished") return "unfinished";
  // No electronic score sheet: nothing to tell beyond the score, which the schedule has.
  if (raw.events.length === 0) return "no-events";

  // A failed league lookup comes back empty and would count as youth, stripping the names of an adult game for good.
  // Skip instead: the nightly sweep retries.
  if (raw.game.league.trim() === "") return "unknown";

  const youth = isYouthGame(raw.game.league);
  const stored = youth ? anonymize(raw) : raw;
  const { game } = stored;

  await writer.createIfNotExists({
    _id: docId(meetingId),
    _type: "matchArchive",
    meetingId,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    date: game.scheduled,
    league: game.league,
    scoreHome: snapshot.scoreHome,
    scoreGuest: snapshot.scoreGuest,
    indexable: !youth,
    highlights: deriveHighlights(snapshot),
    schemaVersion: SCHEMA_VERSION,
    archivedAt: new Date(now).toISOString(),
    payload: JSON.stringify({ ...stored, game: { ...game, live: false } }),
  });
  settled.add(meetingId);
  // The archive is what counts: a Spielplan entry that cannot be updated now is fixed by the nightly sync.
  await recordResult(writer, game, `${snapshot.scoreHome}:${snapshot.scoreGuest}`).catch((error: unknown) =>
    console.error("[archive] result", meetingId, error instanceof Error ? error.message : error),
  );
  refreshPages(meetingId);
  return "archived";
}

/** For `after()` callbacks: archiving must never surface as an error to the fan. */
export async function archiveQuietly(meetingId: string): Promise<void> {
  try {
    await archiveGame(meetingId);
  } catch (error) {
    console.error("[archive]", meetingId, error instanceof Error ? error.message : error);
  }
}

/** Earliest plausible final whistle: two halves, no break. */
const isFinishCandidate = (game: LiveGame, now: number) => {
  const age = now - new Date(game.scheduled).getTime();
  return !game.live && game.scoreboardEnabled && age >= 2 * game.halftimeMinutes * MINUTE_MS && age <= FINISH_WATCH_MS;
};

/** When this instance may look at a game again. */
const nextCheck = new Map<string, number>();

/**
 * Archives games that are probably over, without waiting for a fan to open the ticker or for the nightly sweep.
 * Cheap to call often: each game is looked at once per few minutes, and `archiveGame` only stores a game that is really finished.
 */
export async function archiveFinishedSoon(games: LiveGame[]): Promise<void> {
  const now = Date.now();
  const due = games
    .filter((game) => isFinishCandidate(game, now) && (nextCheck.get(game.meetingId) ?? 0) <= now)
    .slice(0, FINISH_CHECKS_PER_CALL);

  for (const { meetingId } of due) {
    nextCheck.set(meetingId, now + FINISH_RETRY_MS);
    try {
      const outcome = await archiveGame(meetingId);
      if (outcome !== "unfinished") nextCheck.set(meetingId, now + GIVE_UP_RETRY_MS);
    } catch (error) {
      console.error("[archive]", meetingId, error instanceof Error ? error.message : error);
    }
  }
}

export interface SweepSummary {
  candidates: number;
  archived: number;
  failed: number;
}

const isSweepCandidate = (game: LiveGame, now: number) =>
  !game.live && game.scoreboardEnabled && now - new Date(game.scheduled).getTime() >= SWEEP_MIN_AGE_MS;

const MISSING_FROM_ARCHIVE_QUERY = `*[_type == "match" && defined(meetingId) && defined(result)
  && date >= $from && date <= $to && !(meetingId in *[_type == "matchArchive"].meetingId)] | order(date desc).meetingId`;

/** Played games of our Spielplan that have no archive page yet (nuLiga still serves them per game id). */
async function missingFromArchive(now: number): Promise<string[]> {
  const from = new Date(now - BACKFILL_DAYS * DAY_MS).toISOString();
  const to = new Date(now - SWEEP_MIN_AGE_MS).toISOString();
  return client.fetch<string[]>(MISSING_FROM_ARCHIVE_QUERY, { from, to });
}

/**
 * Archives every finished game the ticker window still lists, plus recent Spielplan games that fell out of it.
 * TODO: games without an electronic score sheet are re-checked every night until they leave the backfill window.
 */
export async function archiveRecentGames(): Promise<SweepSummary> {
  const { games } = await getLiveSummary();
  const now = Date.now();
  const windowIds = games.filter((g) => isSweepCandidate(g, now)).map((g) => g.meetingId);
  const backfillIds = await missingFromArchive(now).catch(() => []);
  const candidates = [...new Set([...windowIds.reverse(), ...backfillIds])].slice(0, SWEEP_MAX_GAMES);
  const summary: SweepSummary = { candidates: candidates.length, archived: 0, failed: 0 };

  let next = 0;
  const worker = async () => {
    while (next < candidates.length) {
      const meetingId = candidates[next++];
      try {
        if ((await archiveGame(meetingId)) === "archived") summary.archived++;
      } catch (error) {
        summary.failed++;
        console.error("[archive]", meetingId, error instanceof Error ? error.message : error);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(SWEEP_CONCURRENCY, candidates.length) }, worker));
  return summary;
}
