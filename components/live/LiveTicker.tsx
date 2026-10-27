"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowUp,
  Check,
  ChevronDown,
  CircleX,
  Share2,
  Smartphone,
  Timer,
  Volleyball,
  WifiOff,
} from "lucide-react";
import FilterPill from "@/components/ui/FilterPill";
import { LOCALE_TAGS, type Locale } from "@/i18n/routing";
import { dateFormatter } from "@/lib/i18n/format";
import { formatGameClock } from "@/lib/live/events";
import { isClubTeam } from "@/lib/live/fixture";
import type {
  EntryKind,
  GameStatus,
  LiveGame,
  PlayerLine,
  TableStanding,
  TeamStats,
  TickerEntry,
  TickerSnapshot,
} from "@/lib/live/types";
import MatchFlow from "./MatchFlow";
import { useLiveLabels } from "./useLiveLabels";
import { useChangeCount, useClock, useShare, useWakeLock } from "./useTickerEnv";

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

const MS_PER_SECOND = 1_000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const JUST_NOW_SECONDS = 5;
/** A running game whose data is older than this is flagged as possibly outdated. */
const OUTDATED_AFTER_SECONDS = 45;
/** Height of the fixed site header once scrolled; the sticky score bar docks below it. */
const HEADER_SCROLLED_PX = 60;
/** Feed rows rendered at first and added per click, so a long game does not become a wall of rows. */
const FEED_PAGE_SIZE = 30;

const SCORING_KINDS: ReadonlySet<EntryKind> = new Set(["goal", "seven-meter-goal", "own-goal"]);
const PENALTY_KINDS: ReadonlySet<EntryKind> = new Set([
  "time-penalty",
  "warning",
  "disqualification",
  "team-penalty",
]);
/** Bookkeeping events: shown, but visually quieter than goals and penalties. */
const MINOR_KINDS: ReadonlySet<EntryKind> = new Set(["timeout", "team-penalty"]);

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

/** Locale-aware formatters, rebuilt only when the language changes (the ticker re-renders every few seconds). */
function useTickerFormats() {
  const tag = LOCALE_TAGS[useLocale() as Locale];
  return useMemo(
    () => ({
      time: dateFormatter(tag, { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      kickoff: dateFormatter(tag, { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }),
      kickoffTime: dateFormatter(tag, { hour: "2-digit", minute: "2-digit" }),
    }),
    [tag],
  );
}

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

/** Highest entry index, or -1 for an empty feed. */
function newestIndex(entries: TickerEntry[]): number {
  return entries.reduce((max, e) => Math.max(max, e.idx), -1);
}

interface Visibility {
  visible: boolean;
  /** Not visible because it was scrolled off the top (as opposed to still being further down the page). */
  scrolledPast: boolean;
  seenIdx: number | null;
}

/** Tracks whether `ref` is on screen below the fixed header, and reports the newest entry at each change. */
function useBelowHeaderVisibility(ref: RefObject<HTMLElement | null>, newestIdx: number): Visibility {
  const [state, setState] = useState<Visibility>({ visible: true, scrolledPast: false, seenIdx: null });
  const newestRef = useRef(newestIdx);

  useEffect(() => {
    newestRef.current = newestIdx;
  }, [newestIdx]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        setState({
          visible: entry.isIntersecting,
          scrolledPast: !entry.isIntersecting && entry.boundingClientRect.top < HEADER_SCROLLED_PX,
          seenIdx: newestRef.current,
        }),
      { rootMargin: `-${HEADER_SCROLLED_PX}px 0px 0px 0px` },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return state;
}

/** "ca. 47′" while the game runs; the clock of the latest entry is the best minute nuLiga gives us. */
function useGameMinuteLabel(snapshot: TickerSnapshot): string | null {
  const t = useTranslations("liveTicker");
  if (snapshot.status !== "running" || snapshot.entries.length === 0) return null;
  return t("approxMinute", { minute: Math.floor(snapshot.entries[0].second / SECONDS_PER_MINUTE) });
}

function StatusChip({ status, label }: { status: GameStatus; label: string }) {
  const t = useTranslations("liveTicker");
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
      {running ? t("live") : label}
      {running && <span className="font-bold normal-case tracking-normal opacity-90">· {label}</span>}
    </span>
  );
}

/** How old the data is — the fan's answer to "is this still live?". Silent until the clock is available. */
function Freshness({ status, updatedAt, now }: { status: GameStatus; updatedAt: number; now: number | null }) {
  const t = useTranslations("liveTicker");
  if (now === null || status === "finished") return null;
  const age = Math.max(0, Math.floor((now - updatedAt) / MS_PER_SECOND));
  const outdated = status === "running" && age > OUTDATED_AFTER_SECONDS;
  const ageLabel =
    age < JUST_NOW_SECONDS
      ? t("justNow")
      : age < SECONDS_PER_MINUTE
        ? t("secondsAgo", { seconds: age })
        : t("minutesAgo", { minutes: Math.floor(age / SECONDS_PER_MINUTE) });
  return (
    <span
      className={`text-xs font-semibold tabular-nums ${outdated ? "text-amber-700 dark:text-amber-300" : "text-muted"}`}
    >
      {t("updated", { age: ageLabel })}
    </span>
  );
}

const LOGO_ENDPOINT = "/api/live/logo";

/** White plate keeps the logos' white JPEG backdrop invisible in dark mode too. */
function TeamLogo({ logoId, name }: { logoId: string | null; name: string }) {
  const t = useTranslations("liveTicker");
  const [failed, setFailed] = useState(false);
  if (!logoId || failed) return null;
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-[0_1px_2px_rgb(0_0_0/0.08)] ring-1 ring-gray-200 dark:ring-gray-600 sm:size-14 sm:p-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny proxied logos; next/image would re-encode 50px JPEGs */}
      <img
        src={`${LOGO_ENDPOINT}/${logoId}`}
        alt={t("logoAlt", { name })}
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
  const t = useTranslations("liveTicker");
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
            {t("standing", { rank: standing.rank, points: standing.points })}
          </p>
        )}
      </div>
    </div>
  );
}

/** One score digit; pops once when the value changes, so a goal is noticed without reading. */
function ScoreDigit({ value }: { value: number }) {
  const changes = useChangeCount(value);
  return (
    <span key={changes} className={changes > 0 ? "score-pop" : undefined}>
      {value}
    </span>
  );
}

const ACTION_BUTTON_CLASS =
  "press inline-flex min-h-11 items-center gap-1.5 rounded-full border border-gray-200 px-3 text-sm sm:gap-2 sm:px-4 font-semibold text-text transition-colors hover:border-primary hover:text-primary dark:border-gray-600 dark:text-gray-100 dark:hover:text-primary-glow";

/** Share the score; keep the phone awake while following the game. */
function ActionBar({ snapshot }: { snapshot: TickerSnapshot }) {
  const t = useTranslations("liveTicker");
  const { game } = snapshot;
  const { share, copied } = useShare();
  const wakeLock = useWakeLock();
  const shareText = t("shareText", {
    home: game.homeTeam,
    scoreHome: snapshot.scoreHome,
    scoreGuest: snapshot.scoreGuest,
    away: game.awayTeam,
  });
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      <button type="button" onClick={() => share(shareText, shareText)} className={ACTION_BUTTON_CLASS}>
        {copied ? <Check size={16} aria-hidden="true" /> : <Share2 size={16} aria-hidden="true" />}
        {copied ? t("linkCopied") : t("share")}
      </button>
      {wakeLock.supported && snapshot.status !== "finished" && (
        <button
          type="button"
          onClick={wakeLock.toggle}
          aria-pressed={wakeLock.active}
          className={`${ACTION_BUTTON_CLASS} ${wakeLock.active ? "!border-primary !text-primary dark:!text-primary-glow" : ""}`}
        >
          <Smartphone size={16} aria-hidden="true" />
          {wakeLock.active ? t("awakeOn") : t("keepAwake")}
        </button>
      )}
    </div>
  );
}

function Scoreboard({
  snapshot,
  now,
  scoreRef,
}: {
  snapshot: TickerSnapshot;
  now: number | null;
  scoreRef: RefObject<HTMLDivElement | null>;
}) {
  const t = useTranslations("liveTicker");
  const formats = useTickerFormats();
  const { statusLabel } = useLiveLabels();
  const { game } = snapshot;
  const scheduled = snapshot.status === "scheduled";
  const showHalftime = !scheduled && (game.halftimeHome > 0 || game.halftimeGuest > 0);
  const minute = useGameMinuteLabel(snapshot);
  const progress = [
    minute,
    showHalftime ? t("halftimeScore", { home: game.halftimeHome, guest: game.halftimeGuest }) : null,
  ].filter(Boolean);
  const kickoffDate = formats.kickoff.format(new Date(game.scheduled));
  const countdown = (): string => {
    const minutes = Math.ceil(
      (new Date(game.scheduled).getTime() - (now ?? 0)) / MS_PER_SECOND / SECONDS_PER_MINUTE,
    );
    if (minutes <= 0) return t("kickoffSoon");
    if (minutes < MINUTES_PER_HOUR) return t("kickoffInMinutes", { minutes });
    return t("kickoffInHours", { hours: Math.floor(minutes / MINUTES_PER_HOUR), minutes: minutes % MINUTES_PER_HOUR });
  };
  return (
    <section
      aria-label={t("scoreboard")}
      className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.05)] dark:border-gray-700 dark:bg-gray-800 sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <StatusChip status={snapshot.status} label={statusLabel(snapshot)} />
          <Freshness status={snapshot.status} updatedAt={snapshot.updatedAt} now={now} />
        </div>
        {game.league && (
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted">{game.league}</p>
        )}
      </div>

      <div ref={scoreRef} className="mt-6 flex items-center gap-3 sm:gap-6">
        <TeamColumn name={game.homeTeam} logoId={game.homeLogo} isClub={isClubTeam(game.homeTeam)} align="left" standing={snapshot.table?.home} />
        {scheduled ? (
          <div className="shrink-0 text-center">
            <p className="font-display text-3xl font-bold tabular-nums text-text dark:text-gray-100 sm:text-5xl">
              {t.rich("kickoffTime", {
                time: formats.kickoffTime.format(new Date(game.scheduled)),
                small: (chunks) => <span className="ml-1 text-base font-semibold text-muted sm:text-xl">{chunks}</span>,
              })}
            </p>
            {now !== null && <p className="mt-1 text-xs font-semibold text-muted">{countdown()}</p>}
          </div>
        ) : (
          <p
            className="shrink-0 font-display text-4xl font-bold tracking-tight tabular-nums text-text dark:text-gray-100 sm:text-6xl"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="sr-only">{t("scoreSr")} </span>
            <ScoreDigit value={snapshot.scoreHome} />
            <span className="mx-1.5 text-brand-red" aria-hidden="true">
              :
            </span>
            <span className="sr-only"> {t("scoreSrTo")} </span>
            <ScoreDigit value={snapshot.scoreGuest} />
          </p>
        )}
        <TeamColumn name={game.awayTeam} logoId={game.awayLogo} isClub={isClubTeam(game.awayTeam)} align="right" standing={snapshot.table?.guest} />
      </div>

      {progress.length > 0 && (
        <p className="mt-4 text-center text-sm font-semibold tabular-nums text-text dark:text-gray-100">
          {progress.join(" · ")}
        </p>
      )}
      <p className="mt-3 text-center text-xs text-muted">
        {game.venue
          ? t("kickoffDateVenue", { date: kickoffDate, venue: game.venue })
          : t("kickoffDate", { date: kickoffDate })}
      </p>

      <ActionBar snapshot={snapshot} />
    </section>
  );
}

/** Compact score that docks under the site header once the scoreboard has scrolled away. */
function StickyScore({ snapshot, visible }: { snapshot: TickerSnapshot; visible: boolean }) {
  const { game } = snapshot;
  const minute = useGameMinuteLabel(snapshot);
  const nameClass = (name: string) => `min-w-0 flex-1 truncate text-sm font-bold ${isClubTeam(name) ? "text-primary dark:text-primary-glow" : "text-text dark:text-gray-100"}`;
  return (
    <div
      aria-hidden="true"
      inert={!visible}
      className={`fixed inset-x-0 top-[54px] z-40 border-b border-gray-200 bg-white/95 backdrop-blur transition-[transform,opacity] duration-200 motion-reduce:transition-none dark:border-gray-700 dark:bg-gray-800/95 lg:top-[60px] ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2 sm:px-6">
        <p className={`${nameClass(game.homeTeam)} text-right`}>{game.homeTeam}</p>
        <p className="shrink-0 font-display text-xl font-bold tabular-nums text-text dark:text-gray-100">
          {snapshot.scoreHome}
          <span className="mx-1 text-brand-red">:</span>
          {snapshot.scoreGuest}
        </p>
        <p className={nameClass(game.awayTeam)}>{game.awayTeam}</p>
        {minute && <p className="hidden shrink-0 text-xs font-semibold tabular-nums text-muted sm:block">{minute}</p>}
      </div>
    </div>
  );
}

type Translator = ReturnType<typeof useTranslations<"liveTicker">>;

interface StatRow {
  label: string;
  home: string;
  guest: string;
  /** Numbers behind the comparison bar; omitted for rows that have no meaningful ratio. */
  homeValue?: number;
  guestValue?: number;
}

function statRows(home: TeamStats, guest: TeamStats, t: Translator): StatRow[] {
  const sevenMeter = (t: TeamStats) => `${t.sevenMeterGoals}/${t.sevenMeterAttempts}`;
  const rows: StatRow[] = [
    {
      label: t("statGoalsByHalf"),
      home: `${home.goalsFirstHalf} · ${home.goalsSecondHalf}`,
      guest: `${guest.goalsFirstHalf} · ${guest.goalsSecondHalf}`,
    },
    { label: t("statSevenMeter"), home: sevenMeter(home), guest: sevenMeter(guest), homeValue: home.sevenMeterGoals, guestValue: guest.sevenMeterGoals },
    { label: t("statBiggestLead"), home: String(home.biggestLead), guest: String(guest.biggestLead), homeValue: home.biggestLead, guestValue: guest.biggestLead },
    { label: t("statTimePenalties"), home: String(home.timePenalties), guest: String(guest.timePenalties), homeValue: home.timePenalties, guestValue: guest.timePenalties },
    { label: t("statTimeouts"), home: String(home.timeouts), guest: String(guest.timeouts), homeValue: home.timeouts, guestValue: guest.timeouts },
  ];
  // Rare events only earn a row once something happened.
  if (home.warnings + guest.warnings > 0) {
    rows.push({ label: t("statWarnings"), home: String(home.warnings), guest: String(guest.warnings) });
  }
  if (home.disqualifications + guest.disqualifications > 0) {
    rows.push({ label: t("statDisqualifications"), home: String(home.disqualifications), guest: String(guest.disqualifications) });
  }
  return rows;
}

const barColor = (isClub: boolean): string => (isClub ? "bg-primary" : "bg-gray-400 dark:bg-gray-500");

/** Thin two-colour ratio bar under a stat label; hidden while both values are zero. */
function ComparisonBar({ row, homeIsClub, guestIsClub }: { row: StatRow; homeIsClub: boolean; guestIsClub: boolean }) {
  const { homeValue, guestValue } = row;
  if (homeValue === undefined || guestValue === undefined || homeValue + guestValue === 0) return null;
  const homeShare = (homeValue / (homeValue + guestValue)) * 100;
  return (
    <span aria-hidden="true" className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
      <span className={barColor(homeIsClub)} style={{ width: `${homeShare}%` }} />
      <span className={`flex-1 ${barColor(guestIsClub)}`} />
    </span>
  );
}

/** Small upright card in the referee's colour, with a count when a player has more than one. */
function CardBadge({ count, className, label }: { count: number; className: string; label: string }) {
  const t = useTranslations("liveTicker");
  const text = t("cardCount", { count, label });
  return (
    <span className="inline-flex items-center gap-0.5" title={text}>
      <span className={`inline-block h-3.5 w-2.5 rounded-[2px] ${className}`} aria-hidden="true" />
      {count > 1 && <span className="text-xs font-bold tabular-nums">{count}</span>}
      <span className="sr-only">{text}</span>
    </span>
  );
}

const hasEvents = (p: PlayerLine): boolean => p.goals + p.timePenalties + p.warnings + p.disqualifications > 0;

function PlayerList({ players, align }: { players: PlayerLine[]; align: "left" | "right" }) {
  const t = useTranslations("liveTicker");
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
                title={t("twoMinutes", { count: p.timePenalties })}
              >
                {p.timePenalties}×2′<span className="sr-only"> {t("timePenaltySr")}</span>
              </span>
            )}
            {p.warnings > 0 && <CardBadge count={p.warnings} className="bg-yellow-400" label={t("warning")} />}
            {p.disqualifications > 0 && (
              <CardBadge count={p.disqualifications} className="bg-red-600" label={t("disqualification")} />
            )}
            <span className="w-5 text-right font-bold tabular-nums">{p.goals}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function StatsPanel({ snapshot }: { snapshot: TickerSnapshot }) {
  const t = useTranslations("liveTicker");
  const { game, stats } = snapshot;
  const rows = statRows(stats.home, stats.guest, t);
  const homeIsClub = isClubTeam(game.homeTeam);
  const guestIsClub = isClubTeam(game.awayTeam);
  const [showAll, setShowAll] = useState(false);
  const visible = (players: PlayerLine[]): PlayerLine[] => (showAll ? players : players.filter(hasEvents));
  const hasPlayers = stats.home.players.length + stats.guest.players.length > 0;
  return (
    <details className="group rounded-3xl border border-gray-100 bg-white px-5 py-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.05)] dark:border-gray-700 dark:bg-gray-800 sm:px-6">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-display text-lg font-bold uppercase italic text-text dark:text-gray-100 [&::-webkit-details-marker]:hidden">
        {t("stats")}
        <ChevronDown
          size={18}
          className="text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none dark:text-gray-400"
          aria-hidden="true"
        />
      </summary>
      <table className="my-3 w-full text-sm">
        <caption className="sr-only">
          {t("statsCaption", { home: game.homeTeam, away: game.awayTeam })}
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">{game.homeTeam}</th>
            <th scope="col">{t("statsValue")}</th>
            <th scope="col">{game.awayTeam}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-gray-100 dark:border-gray-700">
              <td className="w-1/4 py-2.5 text-left text-base font-bold tabular-nums">{row.home}</td>
              <th scope="row" className="py-2.5 text-center text-xs font-semibold text-muted">
                {row.label}
                <ComparisonBar row={row} homeIsClub={homeIsClub} guestIsClub={guestIsClub} />
              </th>
              <td className="w-1/4 py-2.5 text-right text-base font-bold tabular-nums">{row.guest}</td>
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
            className="mt-4 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full text-sm font-bold text-link transition-transform duration-100 active:scale-[0.97] motion-reduce:active:scale-100"
          >
            {showAll ? t("onlyWithEvents") : t("showAllPlayers")}
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

type FeedFilter = "all" | "goals" | "penalties";

const FILTER_KINDS: Record<FeedFilter, ReadonlySet<EntryKind> | null> = {
  all: null,
  goals: SCORING_KINDS,
  penalties: PENALTY_KINDS,
};

/** Period dividers stay in every filter so the feed keeps its structure. */
function matchesFilter(entry: TickerEntry, filter: FeedFilter): boolean {
  const kinds = FILTER_KINDS[filter];
  return kinds === null || entry.kind === "period" || kinds.has(entry.kind);
}

/** Our own team's events get a soft tint so the feed reads at a glance. */
function rowTone(entry: TickerEntry, game: TickerSnapshot["game"]): string {
  if (entry.kind === "period") return "bg-gray-50 dark:bg-gray-800/60";
  return isClubEntry(entry, game) ? "bg-red-50 dark:bg-primary/15" : "bg-white dark:bg-gray-800";
}

function isClubEntry(entry: TickerEntry, game: LiveGame): boolean {
  if (entry.side === null) return false;
  return isClubTeam(entry.side === "home" ? game.homeTeam : game.awayTeam);
}

const SEVEN_METER_LABEL = "7m";
const TIME_PENALTY_TAG = "2′";

function CardIcon({ className }: { className: string }) {
  return <span className={`inline-block h-5 w-3.5 rounded-[3px] shadow-sm ${className}`} aria-hidden="true" />;
}

function SevenMeterTag() {
  return <span className="text-xs font-bold leading-none tabular-nums">{SEVEN_METER_LABEL}</span>;
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
          <span className="text-xs font-bold leading-none">{TIME_PENALTY_TAG}</span>
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

/** Player over event label; `teamName` adds the team on the single-column mobile layout. */
function EntryText({
  entry,
  align,
  teamName,
}: {
  entry: TickerEntry;
  align: "left" | "right";
  teamName?: string;
}) {
  const { entryLabel } = useLiveLabels();
  const major = SCORING_KINDS.has(entry.kind);
  const minor = MINOR_KINDS.has(entry.kind);
  const headline = `font-bold ${major ? "text-base" : ""}`;
  const subline = "text-muted dark:text-gray-300";
  return (
    <div className={`min-w-0 break-words leading-snug ${minor ? "text-xs" : "text-sm"} ${align === "right" ? "text-right" : "text-left"}`}>
      {entry.detail && <p className={headline}>{entry.detail}</p>}
      <p className={entry.detail ? subline : headline}>
        {entryLabel(entry)}
        {teamName && <span className="font-normal text-muted dark:text-gray-300"> · {teamName}</span>}
      </p>
    </div>
  );
}

/** One side of an entry in the mirrored layout, with the icon on the edge facing the clock. */
function EntrySide({ entry, align }: { entry: TickerEntry; align: "left" | "right" }) {
  const isHome = align === "right";
  return (
    <div className={`flex min-w-0 items-center gap-3 ${isHome ? "justify-end" : "flex-row-reverse justify-end"}`}>
      <EntryText entry={entry} align={align} />
      <span className="flex w-6 shrink-0 items-center justify-center">
        <EntryIcon kind={entry.kind} />
      </span>
    </div>
  );
}

function ClockAndScore({ entry }: { entry: TickerEntry }) {
  const scoring = SCORING_KINDS.has(entry.kind);
  return (
    <div className="text-center tabular-nums">
      <p className="text-sm font-semibold text-muted dark:text-gray-300">{formatGameClock(entry.second)}</p>
      <p className={`text-text dark:text-gray-100 ${scoring ? "text-lg leading-tight" : "text-base"}`}>
        <span className={scoring && entry.side === "home" ? "font-bold" : ""}>{entry.scoreHome}</span>
        {" – "}
        <span className={scoring && entry.side === "guest" ? "font-bold" : ""}>{entry.scoreGuest}</span>
      </p>
    </div>
  );
}

function EntryRow({ entry, game, fresh }: { entry: TickerEntry; game: LiveGame; fresh: boolean }) {
  const { entryLabel } = useLiveLabels();
  const isPeriod = entry.kind === "period";
  const teamName = entry.side === "home" ? game.homeTeam : entry.side === "guest" ? game.awayTeam : undefined;
  const padding = MINOR_KINDS.has(entry.kind) ? "py-2" : "py-3";
  return (
    <li
      className={`rounded-xl border border-gray-100 px-2.5 sm:px-3 transition-shadow duration-1000 motion-reduce:transition-none dark:border-gray-700 ${padding} ${rowTone(entry, game)} ${
        fresh ? "ring-2 ring-primary/50" : "ring-2 ring-transparent"
      }`}
    >
      {isPeriod ? (
        <p className="text-center text-sm font-bold uppercase tracking-wide">
          {entryLabel(entry)}
          <span className="ml-2 font-mono text-xs font-normal normal-case tracking-normal tabular-nums text-muted dark:text-gray-300">
            {formatGameClock(entry.second)}
          </span>
        </p>
      ) : (
        <>
          {/* Phones: one full-width column; the side is told by the club tint and the team name. */}
          <div className="grid grid-cols-[4.5rem_1.5rem_minmax(0,1fr)] items-center gap-2 sm:hidden">
            <ClockAndScore entry={entry} />
            <span className="flex justify-center">
              <EntryIcon kind={entry.kind} />
            </span>
            <EntryText entry={entry} align="left" teamName={teamName} />
          </div>
          {/* Tablet and up: home events left, guest events right of the clock. */}
          <div className="hidden grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)] items-center gap-3 sm:grid">
            {entry.side === "home" ? <EntrySide entry={entry} align="right" /> : <span aria-hidden="true" />}
            <ClockAndScore entry={entry} />
            {entry.side === "guest" ? <EntrySide entry={entry} align="left" /> : <span aria-hidden="true" />}
          </div>
        </>
      )}
    </li>
  );
}

const FILTER_EMPTY_KEY = { goals: "emptyGoals", penalties: "emptyPenalties" } as const;

function Feed({ snapshot, fresh }: { snapshot: TickerSnapshot; fresh: ReadonlySet<number> }) {
  const t = useTranslations("liveTicker");
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [limit, setLimit] = useState(FEED_PAGE_SIZE);
  const { entries, game } = snapshot;

  const count = (f: FeedFilter) => entries.filter((e) => e.kind !== "period" && matchesFilter(e, f)).length;
  const filtered = entries.filter((e) => matchesFilter(e, filter));
  const shown = filtered.slice(0, limit);
  const hidden = filtered.length - shown.length;
  const pick = (next: FeedFilter) => {
    setFilter(next);
    setLimit(FEED_PAGE_SIZE);
  };

  return (
    <div className="space-y-3">
      <div role="group" aria-label={t("filterLabel")} className="flex flex-wrap gap-2">
        <FilterPill label={t("filterAll")} active={filter === "all"} onClick={() => pick("all")} />
        <FilterPill label={t("filterGoals", { count: count("goals") })} active={filter === "goals"} onClick={() => pick("goals")} />
        <FilterPill label={t("filterPenalties", { count: count("penalties") })} active={filter === "penalties"} onClick={() => pick("penalties")} />
      </div>

      {filter !== "all" && count(filter) === 0 && (
        <p className="rounded-2xl bg-white p-5 text-center text-sm text-muted dark:bg-gray-800 dark:text-gray-300">
          {t(FILTER_EMPTY_KEY[filter])}
        </p>
      )}
      <ol className="space-y-2" aria-label={t("feedLabel")}>
        {shown.map((entry) => (
          <EntryRow key={entry.idx} entry={entry} game={game} fresh={fresh.has(entry.idx)} />
        ))}
      </ol>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + FEED_PAGE_SIZE)}
          className="press flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full text-sm font-bold text-link"
        >
          {t("olderEvents", { count: hidden })}
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** "3 neue Ereignisse ↑" — only while the fan has scrolled away from the top of the feed. */
function NewEventsPill({ count }: { count: number }) {
  const t = useTranslations("liveTicker");
  if (count === 0) return null;
  const scrollToTop = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };
  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="press fixed bottom-5 left-1/2 z-40 inline-flex min-h-11 whitespace-nowrap -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-white shadow-lg"
    >
      <ArrowUp size={16} aria-hidden="true" />
      {t("newEvents", { count })}
    </button>
  );
}

function TickerView({
  snapshot,
  connection,
  failures,
}: {
  snapshot: TickerSnapshot;
  connection: Connection;
  failures: number;
}) {
  const t = useTranslations("liveTicker");
  const formats = useTickerFormats();
  const now = useClock();
  const fresh = useFreshEntries(snapshot.entries);
  const scoreRef = useRef<HTMLDivElement | null>(null);
  const feedTopRef = useRef<HTMLDivElement | null>(null);
  const newest = newestIndex(snapshot.entries);
  const { visible: scoreInView } = useBelowHeaderVisibility(scoreRef, newest);
  // New events only count while the newest feed row is above the viewport; anyone looking at it already sees them.
  const { scrolledPast: pastFeedTop, seenIdx } = useBelowHeaderVisibility(feedTopRef, newest);
  const unseen =
    !pastFeedTop || seenIdx === null
      ? 0
      : snapshot.entries.filter((e) => e.kind !== "period" && e.idx > seenIdx).length;

  const showNotice = connection === "retrying" && failures >= FAILURES_BEFORE_NOTICE;
  return (
    <div className="space-y-4">
      <StickyScore snapshot={snapshot} visible={!scoreInView} />
      <NewEventsPill count={unseen} />

      {showNotice && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-100"
        >
          <WifiOff size={16} aria-hidden="true" />
          {t("connectionLost", { time: formats.time.format(new Date(snapshot.updatedAt)) })}
        </p>
      )}

      <Scoreboard snapshot={snapshot} now={now} scoreRef={scoreRef} />

      {snapshot.entries.length > 0 && <MatchFlow snapshot={snapshot} />}

      {snapshot.entries.length > 0 && <StatsPanel snapshot={snapshot} />}

      {/* Always mounted so the observer is attached even when the first event arrives mid-visit. */}
      <div ref={feedTopRef} aria-hidden="true" className="-mt-4 h-px" />
      {!snapshot.game.scoreboardEnabled && snapshot.entries.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-muted dark:bg-gray-800 dark:text-gray-300">
          {t("noTicker")}
        </p>
      ) : snapshot.entries.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-muted dark:bg-gray-800 dark:text-gray-300">
          {t("beforeKickoff")}
        </p>
      ) : (
        <Feed snapshot={snapshot} fresh={fresh} />
      )}

      <p className="text-center text-xs text-muted">
        {snapshot.status === "finished" ? t("footerFinished") : t("footerRunning")}
      </p>
    </div>
  );
}

export default function LiveTicker({ meetingId, initial }: LiveTickerProps) {
  const t = useTranslations("liveTicker");
  const { snapshot, connection, failures } = useTickerPolling(meetingId, initial);
  const retry = useCallback(() => window.location.reload(), []);

  if (connection === "not-found") {
    return (
      <p className="rounded-2xl bg-white p-6 text-center text-muted dark:bg-gray-800 dark:text-gray-300">
        {t("notFound")}
      </p>
    );
  }

  if (!snapshot) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center dark:bg-gray-800" role="status">
        <p className="font-bold text-text dark:text-gray-100">
          {connection === "retrying" ? t("unreachable") : t("loading")}
        </p>
        {connection === "retrying" && (
          <>
            <p className="mt-2 text-sm text-muted dark:text-gray-300">{t("retryAuto")}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-bold text-white transition-transform duration-100 hover:bg-primary-light active:scale-[0.97] motion-reduce:active:scale-100"
            >
              {t("reload")}
            </button>
          </>
        )}
      </div>
    );
  }

  return <TickerView snapshot={snapshot} connection={connection} failures={failures} />;
}
