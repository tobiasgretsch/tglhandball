"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { Match, Team } from "@/types";
import { CLUB_TIME_ZONE } from "@/lib/dates";
import { OUTCOME_LABEL, parseResult, tgOutcome } from "@/lib/match";
import MatchReportButton from "@/components/ui/MatchReportButton";
import AddToCalendarButton from "@/components/ui/AddToCalendarButton";
import { LiveMatchBadge } from "@/components/live/LiveBadge";

interface MatchdaySectionProps {
  upcoming: Match[];
  lastResult: Match | null;
  /** Teams not covered by the section — linked to their own result pages. */
  otherTeams: Pick<Team, "_id" | "name" | "slug">[];
}

/** Critically damped: settles without overshoot, can be re-targeted mid-flight. */
const SPRING = { type: "spring", bounce: 0, duration: 0.8 } as const;

const COUNTDOWN_UNITS = [
  { key: "days", label: "Tage" },
  { key: "hours", label: "Std" },
  { key: "minutes", label: "Min" },
  { key: "seconds", label: "Sek" },
] as const;

type CountdownParts = Record<(typeof COUNTDOWN_UNITS)[number]["key"], number>;

function partsUntil(target: Date): CountdownParts | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function formatMatchDate(date: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: CLUB_TIME_ZONE,
  }).format(new Date(date));
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function Countdown({ date }: { date: string }) {
  // Rendered only after mount — the server can't know the client's clock,
  // so pre-mount we show fixed-size placeholders to avoid hydration mismatch.
  const [parts, setParts] = useState<CountdownParts | null | "pending">("pending");

  useEffect(() => {
    const target = new Date(date);
    const tick = () => setParts(partsUntil(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [date]);

  if (parts === null) return null; // match has started — no countdown

  return (
    <div className="flex gap-2 sm:gap-3" role="timer" aria-label="Countdown bis zum nächsten Spiel">
      {COUNTDOWN_UNITS.map(({ key, label }) => (
        <div
          key={key}
          className="flex flex-col items-center bg-black/20 rounded-xl px-3 py-2 sm:px-4 sm:py-3 min-w-[3.5rem] sm:min-w-[4.5rem]"
        >
          <span className="font-display font-bold text-3xl sm:text-4xl leading-none text-white tabular-nums">
            {parts === "pending" ? "–" : String(parts[key]).padStart(2, "0")}
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-accent-sky mt-1">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Animated score ───────────────────────────────────────────────────────────

function AnimatedScore({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion() ?? false;
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, reduced]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
    </span>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function MatchdaySection({ upcoming, lastResult, otherTeams }: MatchdaySectionProps) {
  const reduced = useReducedMotion() ?? false;
  const nextMatch = upcoming[0] ?? null;
  const followingMatch = upcoming[1] ?? null;

  if (!nextMatch && !lastResult && otherTeams.length === 0) return null;

  const outcome = lastResult ? tgOutcome(lastResult) : null;
  const score = lastResult?.result ? parseResult(lastResult.result) : null;

  return (
    <section
      aria-labelledby="matchday-heading"
      className="relative bg-accent-dark text-white sheet-top -mt-8 md:-mt-12 pt-14 md:pt-20 pb-16 md:pb-24 overflow-hidden"
    >
      {/* Ambient glows — give the glass cards something to refract */}
      <div
        aria-hidden="true"
        className="absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-accent blur-3xl opacity-60 pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-primary/30 blur-3xl pointer-events-none"
      />

      {/* Watermark — environmental signage, not information */}
      <span
        aria-hidden="true"
        className="absolute -right-6 top-10 font-display font-bold italic uppercase text-[7rem] md:text-[11rem] leading-none text-white/[0.04] select-none pointer-events-none whitespace-nowrap"
      >
        Spieltag
      </span>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={reduced ? { duration: 0 } : SPRING}
        >
          <h2
            id="matchday-heading"
            className="font-display font-bold italic uppercase text-4xl md:text-5xl tracking-[-0.02em]"
          >
            Spieltag
          </h2>
        </motion.div>

        <div className="mt-10 md:mt-14 grid lg:grid-cols-12 gap-10 lg:gap-16">
          {/* ── Nächstes Spiel ─────────────────────────────────────────── */}
          {nextMatch && (
            <motion.div
              className="lg:col-span-7 glass rounded-3xl p-6 md:p-8"
              initial={reduced ? false : { opacity: 0, x: -28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={reduced ? { duration: 0 } : SPRING}
            >
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-sky">
                  Nächstes Spiel
                </p>
                <LiveMatchBadge match={nextMatch} />
              </div>

              <p className="mt-6 font-display font-bold uppercase leading-[0.95] text-3xl sm:text-4xl md:text-5xl text-balance">
                {nextMatch.homeTeam}
                <span className="block font-display italic text-primary-glow text-2xl sm:text-3xl my-1.5">
                  vs.
                </span>
                {nextMatch.awayTeam}
              </p>

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={15} className="text-accent-sky" aria-hidden="true" />
                  {formatMatchDate(nextMatch.date)} Uhr
                </span>
                {nextMatch.venue && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin size={15} className="text-accent-sky" aria-hidden="true" />
                    {nextMatch.venue}
                  </span>
                )}
              </div>

              <div className="mt-7">
                <Countdown date={nextMatch.date} />
              </div>

              <div className="mt-5">
                <AddToCalendarButton match={nextMatch} tone="glass" />
              </div>

              {followingMatch && (
                <div className="mt-8 pt-6 border-t border-white/15">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent-sky mb-1.5">
                    Danach
                  </p>
                  <p className="font-display font-bold uppercase text-lg leading-tight">
                    {followingMatch.homeTeam}{" "}
                    <span className="italic text-white/60">vs.</span>{" "}
                    {followingMatch.awayTeam}
                  </p>
                  <p className="text-sm text-white/70 mt-1">
                    {formatMatchDate(followingMatch.date)} Uhr
                    {followingMatch.venue ? ` · ${followingMatch.venue}` : ""}
                  </p>
                  <div className="mt-3">
                    <AddToCalendarButton match={followingMatch} tone="glass" />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Letztes Ergebnis ───────────────────────────────────────── */}
          {lastResult && (
            <motion.div
              className={`${nextMatch ? "lg:col-span-5" : "lg:col-span-7"} glass rounded-3xl p-6 md:p-8`}
              initial={reduced ? false : { opacity: 0, x: 28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={reduced ? { duration: 0 } : { ...SPRING, delay: 0.12 }}
            >
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-sky">
                  Letztes Ergebnis
                </p>
                {outcome && (
                  <span
                    className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${
                      outcome === "sieg" ? "bg-primary text-white" : "bg-white/15 text-white/90"
                    }`}
                  >
                    {OUTCOME_LABEL[outcome]}
                  </span>
                )}
              </div>

              {score ? (
                <p className="mt-6 font-display font-bold leading-none text-7xl sm:text-8xl tabular-nums" aria-label={`Endstand ${lastResult.result}`}>
                  <AnimatedScore value={score[0]} />
                  <span className="text-primary-glow mx-1">:</span>
                  <AnimatedScore value={score[1]} />
                </p>
              ) : (
                <p className="mt-6 font-display font-bold leading-none text-6xl">
                  {lastResult.result}
                </p>
              )}

              <p className="mt-5 font-display font-bold uppercase text-xl leading-tight text-white/90 text-balance">
                {lastResult.homeTeam}{" "}
                <span className="italic text-white/60">vs.</span>{" "}
                {lastResult.awayTeam}
              </p>
              <p className="text-sm text-white/70 mt-1.5">
                {formatMatchDate(lastResult.date)} Uhr
                {lastResult.team?.name ? ` · ${lastResult.team.name}` : ""}
              </p>
              {lastResult.meetingId && (
                <div className="mt-5">
                  <MatchReportButton meetingId={lastResult.meetingId} tone="glass" />
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* ── Ergebnisse der anderen Teams ───────────────────────────── */}
        {otherTeams.length > 0 && (
          <nav aria-labelledby="other-teams-heading" className="mt-12">
            <h3
              id="other-teams-heading"
              className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-sky"
            >
              Spiele &amp; Ergebnisse unserer Teams
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {otherTeams.map((team) => (
                <li key={team._id}>
                  <Link
                    href={`/teams/${team.slug.current}`}
                    className="btn btn-glass px-4! py-2! text-sm"
                  >
                    {team.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* ── Links ──────────────────────────────────────────────────── */}
        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/spielplan"
            className="btn btn-primary"
          >
            Kompletter Spielplan
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
