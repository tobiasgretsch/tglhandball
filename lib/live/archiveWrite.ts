/**
 * Stores finished games permanently in Sanity (`matchArchive`). Server-only.
 * Triggered lazily when someone follows a finished game, and by the nightly cron
 * for everything the ticker window still knows about.
 */
import { revalidatePath, revalidateTag } from "next/cache";
import { client } from "@/lib/sanity";
import { anonymize, archiveTag, isYouthGame } from "./archive";
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
    revalidatePath("/spielplan");
    revalidatePath("/teams/[slug]", "page");
  } catch {
    // Outside a request (scripts): nothing cached to refresh.
  }
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
