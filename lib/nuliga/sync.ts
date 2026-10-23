import { groq } from "next-sanity";
import { writeClient } from "@/lib/sanity-write";
import { fetchClubGroups } from "@/lib/live/upstream";
import type { ClubGroup } from "@/lib/live/parse";
import { parseClubPage, parseGroupPage, type NuligaMatch } from "./parse";

const NULIGA_CLUB_URL =
  "https://bhv-handball.liga.nu/cgi-bin/WebObjects/nuLigaHBDE.woa/wa/clubInfoDisplay?club=30760";
const GROUP_PAGE_URL =
  "https://bhv-handball.liga.nu/cgi-bin/WebObjects/nuLigaHBDE.woa/wa/groupPage";
const FETCH_TIMEOUT_MS = 15_000;
const GROUP_PAGE_CONCURRENCY = 4;
const DOC_ID_PREFIX = "nuliga-";

interface TeamLeagues {
  _id: string;
  nuligaLeagues: string[];
}

const PROBE_LEAGUE = "?";

interface ExistingMatch {
  _id: string;
  manualOverride?: boolean;
  date?: string;
  homeTeam?: string;
  awayTeam?: string;
  result?: string;
  meetingId?: string;
  venue?: string;
  isHomeGame?: boolean;
  teamRef?: string;
  league?: string;
}

interface SyncSummary {
  parsed: number;
  created: number;
  updated: number;
  unchanged: number;
  skippedManual: number;
  skippedNoDate: number;
  unmappedLeagues: string[];
  /** Own games read from the leagues' whole-season pages (the club page only shows a short window). */
  fromGroupPages: number;
  groupPagesFailed: number;
}

const teamsQuery = groq`*[_type == "team" && count(nuligaLeagues) > 0]{ _id, nuligaLeagues }`;
const existingQuery = groq`*[_type == "match" && defined(nuligaKey)]{
  _id, manualOverride, date, homeTeam, awayTeam, result, meetingId, venue, isHomeGame, "teamRef": team._ref, league
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

async function fetchGroupPage(group: ClubGroup): Promise<string> {
  const query = new URLSearchParams({
    displayTyp: "gesamt",
    displayDetail: "meetings",
    championship: group.championship,
    group: group.id,
  });
  const res = await fetch(`${GROUP_PAGE_URL}?${query}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "User-Agent": "TGL-Handball-Website/1.0 (+https://tglhandball.de)" },
  });
  if (!res.ok) throw new Error(`nuLiga group page ${group.id} responded with HTTP ${res.status}`);
  return res.text();
}

/**
 * The club page names leagues by abbreviation ("RL M"), the group pages by full name, so a group is
 * matched to its abbreviation through the game numbers both pages show.
 */
function leagueOfGroup(rows: NuligaMatch[], leagueByNumber: Map<string, string>): string | undefined {
  const votes = new Map<string, number>();
  for (const row of rows) {
    const league = leagueByNumber.get(row.number);
    if (league) votes.set(league, (votes.get(league) ?? 0) + 1);
  }
  // Game numbers could repeat across leagues; the league most of the group's numbers belong to wins.
  return [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

/** Whole-season own games of every league that belongs to one of our teams. */
async function fetchSeasonGames(
  clubMatches: NuligaMatch[],
  wantedLeagues: ReadonlySet<string>,
): Promise<{ games: NuligaMatch[]; failed: number }> {
  const leagueByNumber = new Map(clubMatches.map((m) => [m.number, m.league]));
  const groups = await fetchClubGroups();
  const games: NuligaMatch[] = [];
  let failed = 0;
  let next = 0;

  const worker = async () => {
    while (next < groups.length) {
      const group = groups[next++];
      try {
        const html = await fetchGroupPage(group);
        const league = leagueOfGroup(parseGroupPage(html, PROBE_LEAGUE), leagueByNumber);
        if (league && wantedLeagues.has(league)) games.push(...parseGroupPage(html, league));
      } catch (error) {
        failed++;
        console.error("[sync-matches]", error instanceof Error ? error.message : error);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(GROUP_PAGE_CONCURRENCY, groups.length) }, worker));
  return { games, failed };
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
    league: match.league,
    isHomeGame: match.isHomeGame,
    team: { _type: "reference" as const, _ref: teamId },
    // Never blank out a result that was already stored.
    ...(match.result ? { result: match.result } : {}),
    ...(match.meetingId ? { meetingId: match.meetingId } : {}),
  };
}

function hasChanges(existing: ExistingMatch, fields: ReturnType<typeof toFields>): boolean {
  return (
    existing.date !== fields.date ||
    existing.homeTeam !== fields.homeTeam ||
    existing.awayTeam !== fields.awayTeam ||
    existing.venue !== fields.venue ||
    existing.league !== fields.league ||
    existing.isHomeGame !== fields.isHomeGame ||
    existing.teamRef !== fields.team._ref ||
    ("result" in fields && existing.result !== fields.result) ||
    ("meetingId" in fields && existing.meetingId !== fields.meetingId)
  );
}

/** Pulls fixtures and results from nuLiga and upserts them as `match` documents. */
export async function syncMatches({ dryRun = false }: { dryRun?: boolean } = {}): Promise<SyncSummary> {
  const [html, teams, existing] = await Promise.all([
    fetchClubPage(),
    writeClient.fetch<TeamLeagues[]>(teamsQuery),
    writeClient.fetch<ExistingMatch[]>(existingQuery),
  ]);

  const clubMatches = parseClubPage(html);
  if (clubMatches.length === 0) {
    // Layout change or error page — fail loudly instead of silently doing nothing.
    throw new Error("nuLiga page contained no fixtures — parser out of date?");
  }

  const leagueIndex = buildLeagueIndex(teams);
  // A failed group page only means fewer old games this run: the club page still carries the current ones.
  const season = await fetchSeasonGames(clubMatches, new Set(leagueIndex.keys())).catch(() => ({
    games: [] as NuligaMatch[],
    failed: 1,
  }));
  // Same key = same fixture; the club page is the fresher source for the games it shows.
  const parsed = [...new Map([...season.games, ...clubMatches].map((m) => [m.key, m])).values()];
  const existingById = new Map(existing.map((m) => [m._id, m]));
  const unmapped = new Set<string>();
  const summary: SyncSummary = {
    parsed: parsed.length,
    fromGroupPages: season.games.length,
    groupPagesFailed: season.failed,
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

  if (!dryRun && summary.created + summary.updated > 0) await transaction.commit();
  summary.unmappedLeagues = [...unmapped].sort();
  return summary;
}
