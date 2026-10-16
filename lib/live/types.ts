/** Shapes shared by the live-ticker server code and its client components. */

export interface LiveGame {
  meetingId: string;
  groupId: string;
  /** League name ("Regionalliga männl. A-Jugend"); empty when unknown. */
  league: string;
  homeTeam: string;
  awayTeam: string;
  /** ISO-8601 (UTC). */
  scheduled: string;
  scoreHome: number;
  scoreGuest: number;
  halftimeHome: number;
  halftimeGuest: number;
  /** nuScoreLive's own flag — true while the time keeper runs the game. */
  live: boolean;
  venue?: string;
  /** Length of one half in minutes (30 for adults, less for youth). */
  halftimeMinutes: number;
  /** Changes with every new event; keys the (immutable) events request. */
  versionUid: string | null;
  /** False when the game is not covered by the electronic score sheet. */
  scoreboardEnabled: boolean;
}

export type GameStatus = "scheduled" | "running" | "break" | "finished";

export type EntryKind =
  | "goal"
  | "seven-meter-goal"
  | "seven-meter-miss"
  | "own-goal"
  | "time-penalty"
  | "warning"
  | "disqualification"
  | "timeout"
  | "team-penalty"
  | "period";

export type TeamSide = "home" | "guest";

export interface TickerEntry {
  idx: number;
  /** Game seconds since kick-off, as reported by the score sheet. */
  second: number;
  kind: EntryKind;
  /** Short headline ("Tor", "Zeitstrafe", …). */
  label: string;
  /** Player line ("#7 Nicolas Schühle") or team name; may be empty. */
  detail: string;
  side: TeamSide | null;
  scoreHome: number;
  scoreGuest: number;
}

export interface ScorerLine {
  /** "#7 Nicolas Schühle" */
  name: string;
  goals: number;
}

export interface TeamStats {
  goals: number;
  sevenMeterGoals: number;
  sevenMeterAttempts: number;
  goalsFirstHalf: number;
  /** Everything after the half-time break, extra time included. */
  goalsSecondHalf: number;
  timePenalties: number;
  warnings: number;
  disqualifications: number;
  timeouts: number;
  biggestLead: number;
  /** Top three; own goals are not credited to a player. */
  scorers: ScorerLine[];
}

export interface MatchStats {
  home: TeamStats;
  guest: TeamStats;
}

/** League standing of one team, as published on the nuLiga group page. */
export interface TableStanding {
  rank: string;
  games: string;
  points: string;
  goalDiff: string;
}

export interface TickerSnapshot {
  game: LiveGame;
  status: GameStatus;
  statusLabel: string;
  scoreHome: number;
  scoreGuest: number;
  /** Newest first. */
  entries: TickerEntry[];
  stats: MatchStats;
  /** Absent when the table could not be read or a team is not listed. */
  table?: { home: TableStanding | null; guest: TableStanding | null };
  /** Epoch ms when the server assembled this snapshot. */
  updatedAt: number;
  /** Set by the API when nuLiga was unreachable and this is the last known state. */
  stale?: boolean;
}

export interface LiveSummary {
  /** TG games from three days back to one week ahead, oldest first. */
  games: LiveGame[];
  /** How long the client should wait before asking again. */
  pollAfterMs: number;
  updatedAt: number;
  /** True when some groups could not be read, so the list may be incomplete. */
  partial: boolean;
}
