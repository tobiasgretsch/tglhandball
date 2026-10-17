"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  CircleX,
  Timer,
  Volleyball,
  WifiOff,
} from "lucide-react";
import { CLUB_TIME_ZONE } from "@/lib/dates";
import { formatGameClock } from "@/lib/live/events";
import { isClubTeam } from "@/lib/live/fixture";
import type {
  EntryKind,
  GameStatus,
  PlayerLine,
  TableStanding,
  TeamStats,
  TickerEntry,
  TickerSnapshot,
} from "@/lib/live/types";

interface LiveTickerProps {
  meetingId: string;
  /** Server-rendered snapshot for an instant first paint; `null` when it could not be loaded. */
  initial: TickerSnapshot | null;
}

type Connection = "ok" | "retrying" | "not-found";

const POLL_MS: Record<GameStatus, number> = {
  // nuLiga publishes in 15 s steps; polling twice per step keeps the lag under ~8 s.
  running: 8_000,
  break: 15_000,
  scheduled: 30_000,
  finished: 0, // no polling once the final whistle is in
};
const ERROR_BACKOFF_START_MS = 5_000;
const ERROR_BACKOFF_MAX_MS = 60_000;
/** After this many failed attempts the "connection lost" notice is shown. */
const FAILURES_BEFORE_NOTICE = 2;
const FRESH_ENTRY_MS = 6_000;

const SCORING_KINDS: ReadonlySet<EntryKind> = new Set(["goal", "seven-meter-goal", "own-goal"]);

function isSnapshot(value: unknown): value is TickerSnapshot {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<TickerSnapshot>;
  return (
    typeof v.game === "object" &&
    v.game !== null &&
    Array.isArray(v.entries) &&
    typeof v.stats === "object" &&
    v.stats !== null &&
    typeof v.status === "string"
  );
}

const timeFormat = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: CLUB_TIME_ZONE,
});
const kickoffFormat = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: CLUB_TIME_ZONE,
});

function useTickerPolling(meetingId: string, initial: TickerSnapshot | null) {
  const [snapshot, setSnapshot] = useState<TickerSnapshot | null>(initial);
  const [connection, setConnection] = useState<Connection>("ok");
  const [failures, setFailures] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    let failureCount = 0;
    let latestUpdate = initial?.updatedAt ?? 0;
    let latestStatus: GameStatus = initial?.status ?? "running";
    let stopped = false;

    const schedule = (delay: number) => {
      clearTimeout(timer);
      if (!stopped && delay > 0) timer = setTimeout(poll, delay);
    };

    async function poll() {
      if (document.hidden) return; // resumed by the visibilitychange handler
      controller?.abort();
      controller = new AbortController();
      try {
        const res = await fetch(`/api/live/${meetingId}`, { signal: controller.signal, cache: "no-store" });
        if (res.status === 404) {
          setConnection("not-found");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: unknown = await res.json();
        if (!isSnapshot(data)) throw new Error("Unexpected payload");

        // Responses can arrive out of order; never step back in time.
        if (data.updatedAt >= latestUpdate) {
          latestUpdate = data.updatedAt;
          latestStatus = data.status;
          setSnapshot(data);
        }
        if (data.stale) {
          // nuLiga is down; the server handed us its last known state.
          failureCount++;
          setFailures(failureCount);
          setConnection("retrying");
          schedule(Math.min(ERROR_BACKOFF_MAX_MS, ERROR_BACKOFF_START_MS * 2 ** (failureCount - 1)));
          return;
        }
        failureCount = 0;
        setFailures(0);
        setConnection("ok");
        schedule(POLL_MS[latestStatus]);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        failureCount++;
        setFailures(failureCount);
        setConnection("retrying");
        schedule(Math.min(ERROR_BACKOFF_MAX_MS, ERROR_BACKOFF_START_MS * 2 ** (failureCount - 1)));
      }
    }

    const onVisibility = () => {
      if (document.hidden) {
        clearTimeout(timer);
        controller?.abort();
      } else {
        schedule(1); // catch up immediately when the tab comes back
      }
    };

    // The server snapshot is already current; the first poll fires right away only if it is missing.
    if (initial) schedule(POLL_MS[initial.status]);
    else schedule(1);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [meetingId, initial]);

  return { snapshot, connection, failures };
}

/** Indexes of entries that appeared since the previous render (never on the first one). */
function useFreshEntries(entries: TickerEntry[]): ReadonlySet<number> {
  const seen = useRef<Set<number> | null>(null);
  const [fresh, setFresh] = useState<ReadonlySet<number>>(new Set());

  useEffect(() => {
    const current = new Set(entries.map((e) => e.idx));
    const previous = seen.current;
    seen.current = current;
    if (!previous) return;

    const added = new Set([...current].filter((idx) => !previous.has(idx)));
    if (added.size === 0) return;
    setFresh(added);
    const timer = setTimeout(() => setFresh(new Set()), FRESH_ENTRY_MS);
    return () => clearTimeout(timer);
  }, [entries]);

  return fresh;
}

function StatusChip({ status, label }: { status: GameStatus; label: string }) {
  const running = status === "running";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${
        running ? "bg-primary text-white" : "bg-gray-100 text-muted dark:bg-gray-700 dark:text-gray-300"
      }`}
    >
      {running && (
        <span className="relative flex size-2" aria-hidden="true">
          <span className="absolute inline-flex size-full rounded-full bg-white opacity-60 animate-ping motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-full bg-white" />
        </span>
      )}
      {running ? "Live" : label}
      {running && <span className="font-bold normal-case tracking-normal opacity-90">· {label}</span>}
    </span>
  );
}

const LOGO_ENDPOINT = "/api/live/logo";

/** White plate keeps the logos' white JPEG backdrop invisible in dark mode too. */
function TeamLogo({ logoId, name }: { logoId: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!logoId || failed) return null;
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-[0_1px_2px_rgb(0_0_0/0.08)] ring-1 ring-gray-200 dark:ring-gray-600 sm:size-14 sm:p-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny proxied logos; next/image would re-encode 50px JPEGs */}
      <img
        src={`${LOGO_ENDPOINT}/${logoId}`}
        alt={`Logo ${name}`}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="size-full object-contain"
      />
    </span>
  );
}

function TeamColumn({
  name,
  logoId,
  isClub,
  align,
  standing,
}: {
  name: string;
  logoId: string | null;
  isClub: boolean;
  align: "left" | "right";
  standing?: TableStanding | null;
}) {
  const isRight = align === "right";
  return (
    <div
      className={`flex min-w-0 flex-1 gap-2 sm:items-center sm:gap-4 ${
        isRight ? "flex-col items-end text-right sm:flex-row-reverse" : "flex-col items-start text-left sm:flex-row"
      }`}
    >
      <TeamLogo logoId={logoId} name={name} />
      <div className="min-w-0">
        <p
          className={`font-display font-bold uppercase leading-tight text-balance text-base sm:text-xl md:text-2xl ${
            isClub ? "text-primary dark:text-primary-glow" : "text-text dark:text-gray-100"
          }`}
        >
          {name}
        </p>
        {standing && (
          <p className="mt-1 text-xs text-muted">
            Platz {standing.rank} · {standing.points} Pkt.
          </p>
        )}
      </div>
    </div>
  );
}

function Scoreboard({ snapshot }: { snapshot: TickerSnapshot }) {
  const { game } = snapshot;
  const showHalftime = snapshot.status !== "scheduled" && (game.halftimeHome > 0 || game.halftimeGuest > 0);
  return (
    <section
      aria-label="Spielstand"
      className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.05)] dark:border-gray-700 dark:bg-gray-800 sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <StatusChip status={snapshot.status} label={snapshot.statusLabel} />
        {game.league && (
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted">{game.league}</p>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3 sm:gap-6">
        <TeamColumn name={game.homeTeam} logoId={game.homeLogo} isClub={isClubTeam(game.homeTeam)} align="left" standing={snapshot.table?.home} />
        <p
          className="shrink-0 font-display text-4xl font-bold tracking-tight tabular-nums text-text dark:text-gray-100 sm:text-6xl"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="sr-only">Spielstand </span>
          {snapshot.scoreHome}
          <span className="mx-1.5 text-brand-red" aria-hidden="true">
            :
          </span>
          <span className="sr-only"> zu </span>
          {snapshot.scoreGuest}
        </p>
        <TeamColumn name={game.awayTeam} logoId={game.awayLogo} isClub={isClubTeam(game.awayTeam)} align="right" standing={snapshot.table?.guest} />
      </div>

      <p className="mt-5 text-center text-xs text-muted">
        {kickoffFormat.format(new Date(game.scheduled))} Uhr
        {game.venue ? ` · ${game.venue}` : ""}
        {showHalftime ? ` · Halbzeit ${game.halftimeHome}:${game.halftimeGuest}` : ""}
      </p>
    </section>
  );
}

interface StatRow {
  label: string;
  home: string;
  guest: string;
}

function statRows(home: TeamStats, guest: TeamStats): StatRow[] {
  const sevenMeter = (t: TeamStats) => `${t.sevenMeterGoals}/${t.sevenMeterAttempts}`;
  return [
    { label: "Tore", home: String(home.goals), guest: String(guest.goals) },
    { label: "Tore 1. Halbzeit", home: String(home.goalsFirstHalf), guest: String(guest.goalsFirstHalf) },
    { label: "Tore 2. Halbzeit", home: String(home.goalsSecondHalf), guest: String(guest.goalsSecondHalf) },
    { label: "7-Meter", home: sevenMeter(home), guest: sevenMeter(guest) },
    { label: "Höchste Führung", home: String(home.biggestLead), guest: String(guest.biggestLead) },
    { label: "2-Minuten-Strafen", home: String(home.timePenalties), guest: String(guest.timePenalties) },
    { label: "Verwarnungen", home: String(home.warnings), guest: String(guest.warnings) },
    { label: "Disqualifikationen", home: String(home.disqualifications), guest: String(guest.disqualifications) },
    { label: "Auszeiten", home: String(home.timeouts), guest: String(guest.timeouts) },
  ];
}

/** Small upright card in the referee's colour, with a count when a player has more than one. */
function CardBadge({ count, className, label }: { count: number; className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`${count}× ${label}`}>
      <span className={`inline-block h-3.5 w-2.5 rounded-[2px] ${className}`} aria-hidden="true" />
      {count > 1 && <span className="text-[11px] font-bold tabular-nums">{count}</span>}
      <span className="sr-only">{`${count}× ${label}`}</span>
    </span>
  );
}

const hasEvents = (p: PlayerLine): boolean => p.goals + p.timePenalties + p.warnings + p.disqualifications > 0;

function PlayerList({ players, align }: { players: PlayerLine[]; align: "left" | "right" }) {
  if (players.length === 0) {
    return <p className={`text-xs text-muted ${align === "right" ? "sm:text-right" : ""}`}>–</p>;
  }
  return (
    <ul className="space-y-1.5">
      {players.map((p) => (
        <li key={p.name} className="flex items-center justify-between gap-2 text-sm">
          <span className={`min-w-0 truncate ${hasEvents(p) ? "" : "text-muted dark:text-gray-300"}`}>{p.name}</span>
          <span className="flex shrink-0 items-center gap-2">
            {p.timePenalties > 0 && (
              <span
                className="text-xs font-bold tabular-nums text-muted"
                title={`${p.timePenalties}× 2 Minuten`}
              >
                {p.timePenalties}×2′<span className="sr-only"> Zeitstrafe</span>
              </span>
            )}
            {p.warnings > 0 && <CardBadge count={p.warnings} className="bg-yellow-400" label="Verwarnung" />}
            {p.disqualifications > 0 && (
              <CardBadge count={p.disqualifications} className="bg-red-600" label="Disqualifikation" />
            )}
            <span className="w-5 text-right font-bold tabular-nums">{p.goals}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function StatsPanel({ snapshot }: { snapshot: TickerSnapshot }) {
  const { game, stats } = snapshot;
  const rows = statRows(stats.home, stats.guest);
  const [showAll, setShowAll] = useState(false);
  const visible = (players: PlayerLine[]): PlayerLine[] => (showAll ? players : players.filter(hasEvents));
  const hasPlayers = stats.home.players.length + stats.guest.players.length > 0;
  return (
    <details className="group rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.05)] dark:border-gray-700 dark:bg-gray-800 sm:p-6">
      <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg font-bold uppercase italic text-text dark:text-gray-100 [&::-webkit-details-marker]:hidden">
        Statistik
        <ChevronDown
          size={18}
          className="text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none dark:text-gray-400"
          aria-hidden="true"
        />
      </summary>
      <table className="mt-3 w-full text-sm">
        <caption className="sr-only">
          Mannschaftsstatistik {game.homeTeam} gegen {game.awayTeam}
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">{game.homeTeam}</th>
            <th scope="col">Wert</th>
            <th scope="col">{game.awayTeam}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-gray-100 dark:border-gray-700">
              <td className="w-1/4 py-2 text-left font-bold tabular-nums">{row.home}</td>
              <th scope="row" className="py-2 text-center text-xs font-semibold text-muted">
                {row.label}
              </th>
              <td className="w-1/4 py-2 text-right font-bold tabular-nums">{row.guest}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {hasPlayers && (
        <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-700">
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
            <div>
              <h3 className="mb-2 truncate text-xs font-bold uppercase tracking-[0.1em] text-muted">
                {game.homeTeam}
              </h3>
              <PlayerList players={visible(stats.home.players)} align="left" />
            </div>
            <div>
              <h3 className="mb-2 truncate text-xs font-bold uppercase tracking-[0.1em] text-muted sm:text-right">
                {game.awayTeam}
              </h3>
              <PlayerList players={visible(stats.guest.players)} align="right" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            aria-expanded={showAll}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold text-link transition-transform duration-100 active:scale-[0.97] motion-reduce:active:scale-100"
          >
            {showAll ? "Nur Spieler mit Ereignissen" : "Alle Spieler anzeigen"}
            <ChevronDown
              size={14}
              className={`transition-transform motion-reduce:transition-none ${showAll ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        </div>
      )}
    </details>
  );
}

/** Our own team's events get a soft tint so the feed reads at a glance. */
function rowTone(entry: TickerEntry, game: TickerSnapshot["game"]): string {
  if (entry.kind === "period") return "bg-gray-50 dark:bg-gray-800/60";
  const side = entry.side;
  const isClub = side !== null && isClubTeam(side === "home" ? game.homeTeam : game.awayTeam);
  return isClub ? "bg-red-50 dark:bg-primary/15" : "bg-white dark:bg-gray-800";
}

const SEVEN_METER_LABEL = "7m";
const TIME_PENALTY_TAG = "2′";

function CardIcon({ className }: { className: string }) {
  return <span className={`inline-block h-5 w-3.5 rounded-[3px] shadow-sm ${className}`} aria-hidden="true" />;
}

function SevenMeterTag() {
  return <span className="text-[10px] font-bold leading-none tabular-nums">{SEVEN_METER_LABEL}</span>;
}

/** Icon column of an entry; kinds without an icon return `null`. */
function EntryIcon({ kind }: { kind: EntryKind }) {
  switch (kind) {
    case "goal":
    case "own-goal":
      return <Volleyball size={22} className="text-primary dark:text-primary-glow" aria-hidden="true" />;
    case "seven-meter-goal":
      return (
        <span className="flex flex-col items-center gap-0.5 text-primary dark:text-primary-glow">
          <Volleyball size={20} aria-hidden="true" />
          <SevenMeterTag />
        </span>
      );
    case "seven-meter-miss":
      return (
        <span className="flex flex-col items-center gap-0.5 text-muted dark:text-gray-300">
          <CircleX size={20} aria-hidden="true" />
          <SevenMeterTag />
        </span>
      );
    case "time-penalty":
      return (
        <span className="flex flex-col items-center gap-0.5 text-text dark:text-gray-100">
          <Timer size={20} aria-hidden="true" />
          <span className="text-[10px] font-bold leading-none">{TIME_PENALTY_TAG}</span>
        </span>
      );
    case "warning":
      return <CardIcon className="bg-yellow-400" />;
    case "disqualification":
      return <CardIcon className="bg-red-600" />;
    default:
      return null;
  }
}

/** One side of an entry: player over event label, with the icon on the edge facing the clock. */
function EntrySide({ entry, align }: { entry: TickerEntry; align: "left" | "right" }) {
  const isHome = align === "right";
  return (
    <div className={`flex min-w-0 items-center gap-2 sm:gap-3 ${isHome ? "justify-end" : "flex-row-reverse justify-end"}`}>
      <div className={`min-w-0 break-words text-sm leading-snug ${isHome ? "text-right" : "text-left"}`}>
        {entry.detail && <p className="font-bold">{entry.detail}</p>}
        <p className={entry.detail ? "text-muted dark:text-gray-300" : "font-bold"}>{entry.label}</p>
      </div>
      <span className="flex w-5 shrink-0 items-center justify-center sm:w-6">
        <EntryIcon kind={entry.kind} />
      </span>
    </div>
  );
}

function EntryRow({ entry, snapshot, fresh }: { entry: TickerEntry; snapshot: TickerSnapshot; fresh: boolean }) {
  const scoring = SCORING_KINDS.has(entry.kind);
  const isPeriod = entry.kind === "period";
  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] items-center gap-2 rounded-xl border border-gray-100 px-2.5 py-3 sm:gap-3 sm:px-3 transition-shadow duration-1000 motion-reduce:transition-none dark:border-gray-700 ${rowTone(entry, snapshot.game)} ${
        fresh ? "ring-2 ring-primary/50" : "ring-2 ring-transparent"
      }`}
    >
      {isPeriod ? (
        <p className="col-span-3 text-center text-sm font-bold uppercase tracking-wide">
          {entry.label}
          <span className="ml-2 font-mono text-xs font-normal normal-case tracking-normal tabular-nums text-muted dark:text-gray-300">
            {formatGameClock(entry.second)}
          </span>
        </p>
      ) : (
        <>
          {entry.side === "home" ? <EntrySide entry={entry} align="right" /> : <span aria-hidden="true" />}
          <div className="text-center tabular-nums">
            <p className="text-xs font-bold text-muted dark:text-gray-300">{formatGameClock(entry.second)}</p>
            <p className="text-base text-text dark:text-gray-100">
              <span className={scoring && entry.side === "home" ? "font-bold" : ""}>{entry.scoreHome}</span>
              {" – "}
              <span className={scoring && entry.side === "guest" ? "font-bold" : ""}>{entry.scoreGuest}</span>
            </p>
          </div>
          {entry.side === "guest" ? <EntrySide entry={entry} align="left" /> : <span aria-hidden="true" />}
        </>
      )}
    </li>
  );
}

export default function LiveTicker({ meetingId, initial }: LiveTickerProps) {
  const { snapshot, connection, failures } = useTickerPolling(meetingId, initial);
  const fresh = useFreshEntries(snapshot?.entries ?? []);
  const retry = useCallback(() => window.location.reload(), []);

  if (connection === "not-found") {
    return (
      <p className="rounded-2xl bg-white p-6 text-center text-muted dark:bg-gray-800 dark:text-gray-300">
        Zu diesem Spiel gibt es keinen Live-Ticker.
      </p>
    );
  }

  if (!snapshot) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center dark:bg-gray-800" role="status">
        <p className="font-bold text-text dark:text-gray-100">
          {connection === "retrying" ? "Der Ticker ist gerade nicht erreichbar." : "Ticker wird geladen …"}
        </p>
        {connection === "retrying" && (
          <>
            <p className="mt-2 text-sm text-muted dark:text-gray-300">Wir versuchen es automatisch erneut.</p>
            <button
              type="button"
              onClick={retry}
              className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-bold text-white transition-transform duration-100 hover:bg-primary-light active:scale-[0.97] motion-reduce:active:scale-100"
            >
              Seite neu laden
            </button>
          </>
        )}
      </div>
    );
  }

  const showNotice = connection === "retrying" && failures >= FAILURES_BEFORE_NOTICE;
  return (
    <div className="space-y-4">
      {showNotice && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-100"
        >
          <WifiOff size={16} aria-hidden="true" />
          Verbindung unterbrochen – Stand von {timeFormat.format(new Date(snapshot.updatedAt))} Uhr. Wir versuchen es weiter.
        </p>
      )}

      <Scoreboard snapshot={snapshot} />

      {snapshot.entries.length > 0 && <StatsPanel snapshot={snapshot} />}

      {!snapshot.game.scoreboardEnabled && snapshot.entries.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-muted dark:bg-gray-800 dark:text-gray-300">
          Für dieses Spiel wird kein Live-Ticker geführt. Das Ergebnis erscheint nach dem Spiel im Spielplan.
        </p>
      ) : snapshot.entries.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-muted dark:bg-gray-800 dark:text-gray-300">
          Sobald das Spiel angepfiffen wird, erscheinen hier alle Tore, Strafen und Auszeiten.
        </p>
      ) : (
        <ol className="space-y-2" aria-label="Spielverlauf, neueste Ereignisse zuerst">
          {snapshot.entries.map((entry) => (
            <EntryRow key={entry.idx} entry={entry} snapshot={snapshot} fresh={fresh.has(entry.idx)} />
          ))}
        </ol>
      )}

      <p className="text-center text-xs text-muted">
        {snapshot.status === "finished"
          ? "Das Spiel ist beendet."
          : `Aktualisiert um ${timeFormat.format(new Date(snapshot.updatedAt))} Uhr · Daten: nuLiga nuScore`}
      </p>
    </div>
  );
}
