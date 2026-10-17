/** Per-team match statistics, derived from the (already side-attributed) feed entries. */
import { playerLabel } from "./events";
import type { RawPlayer } from "./parse";
import type { EntryKind, MatchStats, PlayerLine, TeamSide, TeamStats, TickerEntry } from "./types";

const HALFTIME_LABEL = "Halbzeit";
const PLAYER_COUNTER: Partial<Record<EntryKind, "goals" | "timePenalties" | "warnings" | "disqualifications">> = {
  goal: "goals",
  "seven-meter-goal": "goals",
  "time-penalty": "timePenalties",
  warning: "warnings",
  disqualification: "disqualifications",
};
const GOAL_KINDS: ReadonlySet<EntryKind> = new Set(["goal", "seven-meter-goal", "own-goal"]);

const emptyPlayer = (name: string): PlayerLine => ({ name, goals: 0, timePenalties: 0, warnings: 0, disqualifications: 0 });

const emptyTeam = (): TeamStats => ({
  goals: 0,
  sevenMeterGoals: 0,
  sevenMeterAttempts: 0,
  goalsFirstHalf: 0,
  goalsSecondHalf: 0,
  timePenalties: 0,
  warnings: 0,
  disqualifications: 0,
  timeouts: 0,
  biggestLead: 0,
  players: [],
});

function sortedPlayers(players: Map<string, PlayerLine>): PlayerLine[] {
  return [...players.values()].sort(
    (a, b) =>
      b.goals - a.goals ||
      b.timePenalties - a.timePenalties ||
      b.disqualifications - a.disqualifications ||
      b.warnings - a.warnings ||
      a.name.localeCompare(b.name, "de"),
  );
}

/** `entriesNewestFirst` is the order `buildEntries` returns. */
export function buildStats(
  entriesNewestFirst: TickerEntry[],
  homeTeam: string,
  awayTeam: string,
  roster: RawPlayer[],
): MatchStats {
  const entries = [...entriesNewestFirst].reverse();
  const teams: Record<TeamSide, TeamStats> = { home: emptyTeam(), guest: emptyTeam() };
  const playerLines: Record<TeamSide, Map<string, PlayerLine>> = { home: new Map(), guest: new Map() };
  for (const p of roster) {
    if (p.teamHome === null) continue;
    const name = playerLabel(p.number, p.firstName, p.lastName);
    playerLines[p.teamHome ? "home" : "guest"].set(name, emptyPlayer(name));
  }
  const teamNames: Record<TeamSide, string> = { home: homeTeam, guest: awayTeam };
  let secondHalf = false;

  for (const entry of entries) {
    if (entry.kind === "period" && entry.label === HALFTIME_LABEL) secondHalf = true;
    if (!entry.side) continue;
    const team = teams[entry.side];

    if (GOAL_KINDS.has(entry.kind)) {
      team.goals++;
      if (secondHalf) team.goalsSecondHalf++;
      else team.goalsFirstHalf++;
      const lead = entry.side === "home" ? entry.scoreHome - entry.scoreGuest : entry.scoreGuest - entry.scoreHome;
      team.biggestLead = Math.max(team.biggestLead, lead);
    }
    const counter = PLAYER_COUNTER[entry.kind];
    if (counter && entry.detail && entry.detail !== teamNames[entry.side]) {
      const lines = playerLines[entry.side];
      const line = lines.get(entry.detail) ?? emptyPlayer(entry.detail);
      line[counter]++;
      lines.set(entry.detail, line);
    }

    switch (entry.kind) {
      case "seven-meter-goal":
        team.sevenMeterGoals++;
        team.sevenMeterAttempts++;
        break;
      case "seven-meter-miss":
        team.sevenMeterAttempts++;
        break;
      case "time-penalty":
        team.timePenalties++;
        break;
      case "warning":
        team.warnings++;
        break;
      case "disqualification":
        team.disqualifications++;
        break;
      case "timeout":
        team.timeouts++;
        break;
    }
  }

  teams.home.players = sortedPlayers(playerLines.home);
  teams.guest.players = sortedPlayers(playerLines.guest);
  return teams;
}
