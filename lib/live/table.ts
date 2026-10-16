/** League standing of the two teams, read from the public nuLiga group page. */
import { fetchStandings, type StandingRow } from "@/lib/nuliga/standings";
import { normalizeTeamName } from "./fixture";
import { fetchClubGroups } from "./upstream";
import type { TableStanding, TickerSnapshot } from "./types";

const GROUP_PAGE_URL =
  "https://bhv-handball.liga.nu/cgi-bin/WebObjects/nuLigaHBDE.woa/wa/groupPage";

function toStanding(row: StandingRow | undefined): TableStanding | null {
  return row ? { rank: row.rank, games: row.games, points: row.points, goalDiff: row.goalDiff } : null;
}

/** `undefined` when the group is unknown, the page unreadable, or neither team is listed. */
export async function fetchTableFor(
  groupId: string,
  homeTeam: string,
  awayTeam: string,
): Promise<TickerSnapshot["table"]> {
  const group = (await fetchClubGroups()).find((g) => g.id === groupId);
  if (!group) return undefined;

  const url = `${GROUP_PAGE_URL}?championship=${encodeURIComponent(group.championship)}&group=${group.id}`;
  const rows = await fetchStandings(url);
  const find = (team: string) => rows.find((r) => normalizeTeamName(r.team) === normalizeTeamName(team));

  const home = toStanding(find(homeTeam));
  const guest = toStanding(find(awayTeam));
  return home || guest ? { home, guest } : undefined;
}
