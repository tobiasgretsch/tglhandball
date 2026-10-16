/**
 * Defensive parsers for the nuScoreLive REST payloads. Nothing here trusts the
 * shape of the input: malformed entries are dropped rather than thrown on.
 */
import type { LiveGame } from "./types";

export interface RawEvent {
  idx: number;
  second: number;
  code: number;
  meetingPersonId: string | null;
  firstName: string | null;
  lastName: string | null;
  pointsHome: number;
  pointsGuest: number;
  teamHome: boolean | null;
}

export interface RawPlayer {
  meetingPersonId: string;
  number: string;
  firstName: string;
  lastName: string;
  teamHome: boolean | null;
}

export interface ClubGroup {
  id: string;
  championship: string;
  name: string;
}

const DEFAULT_HALFTIME_MINUTES = 30;
const MEETING_ID_PATTERN = /^\d{4,12}$/;
const GROUP_LINK = /groupPage\?championship=([^&"]+)&(?:amp;)?group=(\d+)"[^>]*>([^<]*)</g;

export function isValidMeetingId(value: string): boolean {
  return MEETING_ID_PATTERN.test(value);
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function asInt(value: unknown, fallback = 0): number {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

/** nuLiga sends "+0000" offsets; normalise to a strict ISO string (or null). */
function toIso(value: unknown): string | null {
  const text = asString(value);
  if (!text) return null;
  const date = new Date(text.replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function parseMeeting(raw: unknown, league = ""): LiveGame | null {
  if (!isRecord(raw)) return null;
  const meetingId = asString(raw.meetingID);
  const homeTeam = asString(raw.teamHome);
  const awayTeam = asString(raw.teamGuest);
  const scheduled = toIso(raw.scheduled);
  if (!meetingId || !isValidMeetingId(meetingId) || !homeTeam || !awayTeam || !scheduled) {
    return null;
  }
  const halftime = asInt(raw.halftimeLength, DEFAULT_HALFTIME_MINUTES);
  return {
    meetingId,
    groupId: asString(raw.groupID) ?? "",
    league,
    homeTeam,
    awayTeam,
    scheduled,
    scoreHome: Math.max(0, asInt(raw.matchesHome)),
    scoreGuest: Math.max(0, asInt(raw.matchesGuest)),
    halftimeHome: Math.max(0, asInt(raw.halfTimeScoreHome)),
    halftimeGuest: Math.max(0, asInt(raw.halfTimeScoreGuest)),
    live: raw.live === true,
    venue: asString(raw.courtHallName) ?? undefined,
    halftimeMinutes: halftime > 0 ? halftime : DEFAULT_HALFTIME_MINUTES,
    versionUid: asString(raw.versionUid),
    scoreboardEnabled: raw.nuScoreLiveEnabled !== false,
  };
}

/** `{"meetings":[…]}` → games, silently skipping unusable entries. */
export function parseMeetings(raw: unknown, league = ""): LiveGame[] {
  if (!isRecord(raw) || !Array.isArray(raw.meetings)) return [];
  return raw.meetings.flatMap((m) => parseMeeting(m, league) ?? []);
}

export function parseEvents(raw: unknown): RawEvent[] {
  if (!isRecord(raw) || !Array.isArray(raw.events)) return [];
  const byIdx = new Map<number, RawEvent>();
  for (const item of raw.events) {
    if (!isRecord(item) || typeof item.event !== "number" || typeof item.idx !== "number") continue;
    byIdx.set(item.idx, {
      idx: item.idx,
      second: Math.max(0, asInt(item.second)),
      code: item.event,
      meetingPersonId: asString(item.meetingPersonId),
      firstName: asString(item.personFirstname),
      lastName: asString(item.personLastname),
      pointsHome: Math.max(0, asInt(item.pointsHome)),
      pointsGuest: Math.max(0, asInt(item.pointsGuest)),
      teamHome: asBoolean(item.teamHome),
    });
  }
  return [...byIdx.values()].sort((a, b) => a.idx - b.idx);
}

export function parsePlayers(raw: unknown): RawPlayer[] {
  if (!isRecord(raw) || !Array.isArray(raw.meetingPersons)) return [];
  return raw.meetingPersons.flatMap((item): RawPlayer[] => {
    if (!isRecord(item)) return [];
    const meetingPersonId = asString(item.meetingPersonId);
    if (!meetingPersonId) return [];
    return [
      {
        meetingPersonId,
        number: asString(item.nr) ?? "",
        firstName: asString(item.firstname) ?? "",
        lastName: asString(item.lastname) ?? "",
        teamHome: asBoolean(item.teamHome),
      },
    ];
  });
}

/** Reads the league name out of `groups/{id}`; empty when unavailable. */
export function parseGroupName(raw: unknown): string {
  return (isRecord(raw) && (asString(raw.league) ?? asString(raw.name))) || "";
}

/** All groups the club takes part in, scraped from the nuLiga "Mannschaften" page. */
export function parseClubGroups(html: string): ClubGroup[] {
  const seen = new Map<string, ClubGroup>();
  for (const m of html.matchAll(GROUP_LINK)) {
    const [, championship, id, name] = m;
    if (seen.has(id)) continue;
    seen.set(id, {
      id,
      championship: decodeURIComponent(championship.replace(/\+/g, " ")),
      name: name.replace(/\s+/g, " ").trim(),
    });
  }
  return [...seen.values()];
}
