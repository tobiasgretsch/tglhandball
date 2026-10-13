import { groq } from "next-sanity";
import { writeClient } from "@/lib/sanity-write";
import { parseClubPage, type NuligaMatch } from "./parse";

const NULIGA_CLUB_URL =
  "https://bhv-handball.liga.nu/cgi-bin/WebObjects/nuLigaHBDE.woa/wa/clubInfoDisplay?club=30760";
const FETCH_TIMEOUT_MS = 15_000;
const DOC_ID_PREFIX = "nuliga-";

interface TeamLeagues {
  _id: string;
  nuligaLeagues: string[];
}

interface ExistingMatch {
  _id: string;
  manualOverride?: boolean;
  date?: string;
  homeTeam?: string;
  awayTeam?: string;
  result?: string;
  venue?: string;
  isHomeGame?: boolean;
  teamRef?: string;
}

export interface SyncSummary {
  parsed: number;
  created: number;
  updated: number;
  unchanged: number;
  skippedManual: number;
  skippedNoDate: number;
  unmappedLeagues: string[];
}

const teamsQuery = groq`*[_type == "team" && count(nuligaLeagues) > 0]{ _id, nuligaLeagues }`;
const existingQuery = groq`*[_type == "match" && defined(nuligaKey)]{
  _id, manualOverride, date, homeTeam, awayTeam, result, venue, isHomeGame, "teamRef": team._ref
}`;

async function fetchClubPage(): Promise<string> {
  const res = await fetch(NULIGA_CLUB_URL, {
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "User-Agent": "TGL-Handball-Website/1.0 (+https://tglhandball.de)" },
  });
  if (!res.ok) throw new Error(`nuLiga responded with HTTP ${res.status}`);
  return res.text();
}

function buildLeagueIndex(teams: TeamLeagues[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const team of teams) {
    for (const league of team.nuligaLeagues) index.set(league.trim(), team._id);
  }
  return index;
}

function toFields(match: NuligaMatch, teamId: string) {
  return {
    date: match.date as string,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    venue: match.venue,
    isHomeGame: match.isHomeGame,
    team: { _type: "reference" as const, _ref: teamId },
    // Never blank out a result that was already stored.
    ...(match.result ? { result: match.result } : {}),
  };
}

function hasChanges(existing: ExistingMatch, fields: ReturnType<typeof toFields>): boolean {
  return (
    existing.date !== fields.date ||
    existing.homeTeam !== fields.homeTeam ||
    existing.awayTeam !== fields.awayTeam ||
    existing.venue !== fields.venue ||
    existing.isHomeGame !== fields.isHomeGame ||
    existing.teamRef !== fields.team._ref ||
    ("result" in fields && existing.result !== fields.result)
  );
}

/** Pulls fixtures and results from nuLiga and upserts them as `match` documents. */
export async function syncMatches(): Promise<SyncSummary> {
  const [html, teams, existing] = await Promise.all([
    fetchClubPage(),
    writeClient.fetch<TeamLeagues[]>(teamsQuery),
    writeClient.fetch<ExistingMatch[]>(existingQuery),
  ]);

  const parsed = parseClubPage(html);
  if (parsed.length === 0) {
    // Layout change or error page — fail loudly instead of silently doing nothing.
    throw new Error("nuLiga page contained no fixtures — parser out of date?");
  }

  const leagueIndex = buildLeagueIndex(teams);
  const existingById = new Map(existing.map((m) => [m._id, m]));
  const unmapped = new Set<string>();
  const summary: SyncSummary = {
    parsed: parsed.length,
    created: 0,
    updated: 0,
    unchanged: 0,
    skippedManual: 0,
    skippedNoDate: 0,
    unmappedLeagues: [],
  };

  const transaction = writeClient.transaction();
  for (const match of parsed) {
    const teamId = leagueIndex.get(match.league);
    if (!teamId) {
      unmapped.add(match.league);
      continue;
    }
    if (!match.date) {
      summary.skippedNoDate++;
      continue;
    }

    const id = `${DOC_ID_PREFIX}${match.key}`;
    const fields = toFields(match, teamId);
    const current = existingById.get(id);

    if (!current) {
      transaction.create({ _id: id, _type: "match", nuligaKey: match.key, ...fields });
      summary.created++;
    } else if (current.manualOverride) {
      summary.skippedManual++;
    } else if (hasChanges(current, fields)) {
      transaction.patch(id, (p) => p.set(fields));
      summary.updated++;
    } else {
      summary.unchanged++;
    }
  }

  if (summary.created + summary.updated > 0) await transaction.commit();
  summary.unmappedLeagues = [...unmapped].sort();
  return summary;
}
