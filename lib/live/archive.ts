/**
 * Permanent copy of finished games. The raw nuLiga data is stored (not the derived
 * snapshot), so later improvements to the feed and the statistics reach old games too.
 * Read side only — see `archiveWrite.ts` for storing.
 */
import { groq } from "next-sanity";
import { client } from "@/lib/sanity";
import type { RawGame } from "./ticker";
import { deriveSnapshot } from "./ticker";
import type { TickerSnapshot } from "./types";

export const archiveTag = (meetingId: string) => `archive:${meetingId}`;

/** Re-reads an archived game at most this often. A game is archived once and never changes. */
const ARCHIVE_REVALIDATE_SECONDS = 300;
const YOUTH_LEAGUE = /jugend|mini/i;
const ANONYMOUS_NAME = "";

/** Leagues for children and teens; an unknown league counts as youth, to err on the side of privacy. */
export function isYouthGame(league: string): boolean {
  return league.trim() === "" || YOUTH_LEAGUE.test(league);
}

/** Youth games keep shirt numbers only — no name is ever persisted or published. */
export function anonymize(raw: RawGame): RawGame {
  return {
    ...raw,
    events: raw.events.map((e) => ({ ...e, firstName: null, lastName: null })),
    players: raw.players.map((p) => ({ ...p, firstName: ANONYMOUS_NAME, lastName: ANONYMOUS_NAME })),
  };
}

export interface ArchivedGame {
  snapshot: TickerSnapshot;
  /** False for youth games: the page is reachable by link but kept out of search engines. */
  indexable: boolean;
  highlights: string[];
}

interface ArchiveDocument {
  payload: string;
  indexable: boolean;
  highlights?: string[];
}

const archiveQuery = groq`*[_type == "matchArchive" && meetingId == $meetingId][0]{ payload, indexable, highlights }`;

function parsePayload(payload: string): RawGame | null {
  try {
    const raw: unknown = JSON.parse(payload);
    if (typeof raw !== "object" || raw === null) return null;
    const { game, events, players } = raw as Partial<RawGame>;
    if (!game || typeof game.meetingId !== "string" || !Array.isArray(events) || !Array.isArray(players)) return null;
    return raw as RawGame;
  } catch {
    return null;
  }
}

/** `null` when the game was never archived (or its payload is unreadable). */
export async function getArchivedGame(meetingId: string): Promise<ArchivedGame | null> {
  const doc = await client
    .fetch<ArchiveDocument | null>(
      archiveQuery,
      { meetingId },
      { next: { revalidate: ARCHIVE_REVALIDATE_SECONDS, tags: [archiveTag(meetingId)] } },
    )
    .catch(() => null);
  if (!doc) return null;

  const raw = parsePayload(doc.payload);
  if (!raw) return null;
  return {
    snapshot: deriveSnapshot(raw, Date.now()),
    indexable: doc.indexable,
    highlights: doc.highlights ?? [],
  };
}
