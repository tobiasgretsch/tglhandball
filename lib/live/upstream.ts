/**
 * Server-side client for nuLiga's score service (nuScoreLive). The service has
 * no CORS for our origin, so browsers never talk to it directly.
 *
 * Its URLs end in `/time/<unix>`: the number only keys the CDN cache (answers are
 * cacheable for an hour), so we pass a bucketed timestamp to get a fresh copy once
 * per bucket. The backend rejects any value that is not a multiple of 15 seconds
 * (HTTP 204/500), so buckets are rounded up to that step — which is also the
 * freshest the official nuScoreLive client ever sees over REST.
 */
import {
  parseClubGroups,
  parseEvents,
  parseGroupName,
  parseMeeting,
  parseMeetings,
  parsePlayers,
  type ClubGroup,
  type RawEvent,
  type RawPlayer,
} from "./parse";
import type { LiveGame } from "./types";

const REST_BASE = (
  process.env.NULIGA_LIVE_REST_BASE ?? "https://hbde-live.liga.nu/nuScoreLiveRestBackend/api/1"
).replace(/\/$/, "");
const CLUB_TEAMS_URL =
  process.env.NULIGA_CLUB_TEAMS_URL ??
  "https://bhv-handball.liga.nu/cgi-bin/WebObjects/nuLigaHBDE.woa/wa/clubTeams?club=30760";
const USER_AGENT = "TGL-Handball-Website/1.0 (+https://tglhandball.de)";

const REQUEST_TIMEOUT_MS = 3_000;
const RETRY_DELAY_MS = 250;
const MAX_ATTEMPTS = 2;
const HTTP_NOT_FOUND = 404;
const HTTP_BAD_REQUEST = 400;
const HTTP_SERVER_ERROR = 500;
const TIME_STEP_SECONDS = 15;

/** How long Next's shared data cache may reuse a response, per kind of data. */
const CACHE = {
  clubGroups: { revalidate: 6 * 60 * 60 },
  groupName: { revalidate: 6 * 60 * 60 },
  schedule: { revalidate: 10 * 60, bucketSeconds: 10 * 60 },
  /** Events are keyed by an immutable version id, so they never go stale. */
  events: { revalidate: 24 * 60 * 60 },
  players: { revalidate: 60, bucketSeconds: 60 },
  logos: { revalidate: 24 * 60 * 60 },
  liveGroup: { bucketSeconds: TIME_STEP_SECONDS },
  liveMeeting: { bucketSeconds: TIME_STEP_SECONDS },
} as const;

class UpstreamError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

interface FetchOptions {
  /** Next data-cache lifetime in seconds; omit for an uncached request. */
  revalidate?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function timeSegment(bucketSeconds: number): string {
  const bucket = Math.ceil(bucketSeconds / TIME_STEP_SECONDS) * TIME_STEP_SECONDS;
  const seconds = Math.floor(Date.now() / 1000);
  return `time/${seconds - (seconds % bucket)}`;
}

function isRetryable(error: unknown): boolean {
  return !(error instanceof UpstreamError) || (error.status ?? HTTP_SERVER_ERROR) >= HTTP_SERVER_ERROR;
}

async function attempt(url: string, options: FetchOptions): Promise<Response> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { "User-Agent": USER_AGENT },
    ...(options.revalidate ? { next: { revalidate: options.revalidate } } : { cache: "no-store" }),
  });
  if (res.ok) return res;
  throw new UpstreamError(`nuLiga responded with HTTP ${res.status}`, res.status);
}

async function request(url: string, options: FetchOptions): Promise<Response> {
  let lastError: unknown;
  for (let n = 1; n <= MAX_ATTEMPTS; n++) {
    try {
      return await attempt(url, options);
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || n === MAX_ATTEMPTS) break;
      await sleep(RETRY_DELAY_MS);
    }
  }
  if (lastError instanceof UpstreamError) throw lastError;
  throw new UpstreamError(lastError instanceof Error ? lastError.message : "nuLiga unreachable");
}

/** `null` for 400/404 (unknown id), `UpstreamError` for everything else that fails. */
async function getJson(path: string, revalidate?: number): Promise<unknown | null> {
  try {
    const res = await request(`${REST_BASE}/${path}`, { revalidate });
    // The backend answers errors as HTML pages, sometimes with status 200 via proxies.
    if (!res.headers.get("content-type")?.includes("json")) {
      throw new UpstreamError("nuLiga returned a non-JSON response");
    }
    return await res.json();
  } catch (error) {
    if (error instanceof UpstreamError && (error.status === HTTP_NOT_FOUND || error.status === HTTP_BAD_REQUEST)) {
      return null;
    }
    if (error instanceof SyntaxError) throw new UpstreamError("nuLiga returned malformed JSON");
    throw error;
  }
}

interface Logo {
  body: ArrayBuffer;
  contentType: string;
}

/** A club logo from the live backend; `null` for an unknown id. Logos never change, so they cache for a day. */
export async function fetchLogo(logoId: string): Promise<Logo | null> {
  try {
    const res = await request(`${REST_BASE}/images/${logoId}`, { revalidate: CACHE.logos.revalidate });
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) throw new UpstreamError("nuLiga returned a non-image response");
    return { body: await res.arrayBuffer(), contentType };
  } catch (error) {
    if (error instanceof UpstreamError && (error.status === HTTP_NOT_FOUND || error.status === HTTP_BAD_REQUEST)) {
      return null;
    }
    throw error;
  }
}

export async function fetchClubGroups(): Promise<ClubGroup[]> {
  const res = await request(CLUB_TEAMS_URL, { revalidate: CACHE.clubGroups.revalidate });
  return parseClubGroups(await res.text());
}

export async function fetchGroupName(groupId: string): Promise<string> {
  if (!/^\d+$/.test(groupId)) return "";
  return parseGroupName(await getJson(`groups/${groupId}`, CACHE.groupName.revalidate));
}

/** Every game of a group. `fast` bypasses the shared cache for groups with a game under way. */
export async function fetchGroupMeetings(group: ClubGroup, mode: "slow" | "fast"): Promise<LiveGame[]> {
  const bucket = mode === "slow" ? CACHE.schedule.bucketSeconds : CACHE.liveGroup.bucketSeconds;
  const revalidate = mode === "slow" ? CACHE.schedule.revalidate : undefined;
  return parseMeetings(await getJson(`meetings/${group.id}/${timeSegment(bucket)}`, revalidate), group.name);
}

export async function fetchMeeting(meetingId: string): Promise<LiveGame | null> {
  const raw = await getJson(`meeting/${meetingId}/${timeSegment(CACHE.liveMeeting.bucketSeconds)}`);
  return parseMeeting(raw);
}

export async function fetchEvents(meetingId: string, versionUid: string | null): Promise<RawEvent[]> {
  // A version-less URL would be served from a one-hour CDN cache, so buster it.
  const path = versionUid
    ? `events/${meetingId}/versions/${encodeURIComponent(versionUid)}`
    : `events/${meetingId}?_=${Math.floor(Date.now() / 5000)}`;
  const raw = await getJson(path, versionUid ? CACHE.events.revalidate : undefined);
  return parseEvents(raw);
}

export async function fetchPlayers(meetingId: string): Promise<RawPlayer[]> {
  const raw = await getJson(
    `players/${meetingId}/${timeSegment(CACHE.players.bucketSeconds)}`,
    CACHE.players.revalidate,
  );
  return parsePlayers(raw);
}
