/** Per-team match statistics, derived from the (already side-attributed) feed entries. */
import type { EntryKind, MatchStats, ScorerLine, TeamSide, TeamStats, TickerEntry } from "./types";

const TOP_SCORERS = 3;
const HALFTIME_LABEL = "Halbzeit";
const PLAYER_GOAL_KINDS: ReadonlySet<EntryKind> = new Set(["goal", "seven-meter-goal"]);
const GOAL_KINDS: ReadonlySet<EntryKind> = new Set(["goal", "seven-meter-goal", "own-goal"]);

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
  scorers: [],
});

function topScorers(counts: Map<string, number>): ScorerLine[] {
  return [...counts]
    .map(([name, goals]) => ({ name, goals }))
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name, "de"))
    .slice(0, TOP_SCORERS);
}

/** `entriesNewestFirst` is the order `buildEntries` returns. */
export function buildStats(entriesNewestFirst: TickerEntry[], homeTeam: string, awayTeam: string): MatchStats {
  const entries = [...entriesNewestFirst].reverse();
  const teams: Record<TeamSide, TeamStats> = { home: emptyTeam(), guest: emptyTeam() };
  const scorerCounts: Record<TeamSide, Map<string, number>> = { home: new Map(), guest: new Map() };
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
    if (PLAYER_GOAL_KINDS.has(entry.kind) && entry.detail && entry.detail !== teamNames[entry.side]) {
      const counts = scorerCounts[entry.side];
      counts.set(entry.detail, (counts.get(entry.detail) ?? 0) + 1);
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

  teams.home.scorers = topScorers(scorerCounts.home);
  teams.guest.scorers = topScorers(scorerCounts.guest);
  return teams;
}
