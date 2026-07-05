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
import type { Match } from "@/types";

interface MatchdaySectionProps {
  upcoming: Match[];
  lastResult: Match | null;
}

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
  }).format(new Date(date));
}

/** Parses "28:24" → [28, 24]; null when the string isn't a score. */
function parseResult(result: string): [number, number] | null {
  const match = result.trim().match(/^(\d+)\s*:\s*(\d+)$/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2])];
}

type Outcome = "sieg" | "niederlage" | "unentschieden";

function tgOutcome(match: Match): Outcome | null {
  if (!match.result) return null;
  const score = parseResult(match.result);
  if (!score) return null;
  const [home, away] = score;
  if (home === away) return "unentschieden";
  const tgWon = match.isHomeGame ? home > away : away > home;
  return tgWon ? "sieg" : "niederlage";
}

const OUTCOME_LABEL: Record<Outcome, string> = {
  sieg: "Sieg",
  niederlage: "Niederlage",
  unentschieden: "Unentschieden",
};

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
          className="flex flex-col items-center bg-white/10 rounded-lg px-3 py-2 sm:px-4 sm:py-3 min-w-[3.5rem] sm:min-w-[4.5rem]"
        >
          <span className="font-display font-bold text-3xl sm:text-4xl leading-none text-white tabular-nums">
            {parts === "pending" ? "–" : String(parts[key]).padStart(2, "0")}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-accent-sky mt-1">
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

export default function MatchdaySection({ upcoming, lastResult }: MatchdaySectionProps) {
  const reduced = useReducedMotion() ?? false;
  const nextMatch = upcoming[0] ?? null;
  const followingMatch = upcoming[1] ?? null;

  if (!nextMatch && !lastResult) return null;

  const outcome = lastResult ? tgOutcome(lastResult) : null;
  const score = lastResult?.result ? parseResult(lastResult.result) : null;

  return (
    <section
      aria-labelledby="matchday-heading"
      className="relative bg-accent-dark text-white clip-diagonal-t -mt-10 pt-20 md:pt-28 pb-16 md:pb-24 overflow-hidden"
    >
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
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2
            id="matchday-heading"
            className="font-display font-bold italic uppercase text-4xl md:text-5xl tracking-tight"
          >
            Spieltag
          </h2>
          <div className="mt-2 h-1.5 w-16 bg-primary -skew-x-12" aria-hidden="true" />
        </motion.div>

        <div className="mt-10 md:mt-14 grid lg:grid-cols-12 gap-10 lg:gap-16">
          {/* ── Nächstes Spiel ─────────────────────────────────────────── */}
          {nextMatch && (
            <motion.div
              className="lg:col-span-7"
              initial={reduced ? false : { opacity: 0, x: -28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="inline-block bg-primary text-white font-display font-bold italic uppercase text-lg px-4 py-1 -skew-x-12">
                <span className="inline-block skew-x-12">Nächstes Spiel</span>
              </p>

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

              {followingMatch && (
                <div className="mt-8 pt-6 border-t border-white/15">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-accent-sky mb-1.5">
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
                </div>
              )}
            </motion.div>
          )}

          {/* ── Letztes Ergebnis ───────────────────────────────────────── */}
          {lastResult && (
            <motion.div
              className={nextMatch ? "lg:col-span-5" : "lg:col-span-7"}
              initial={reduced ? false : { opacity: 0, x: 28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.12 }}
            >
              <div className="flex items-center gap-3">
                <p className="inline-block bg-white/10 font-display font-bold italic uppercase text-lg px-4 py-1 -skew-x-12">
                  <span className="inline-block skew-x-12">Letztes Ergebnis</span>
                </p>
                {outcome && (
                  <span
                    className={`font-display font-bold italic uppercase text-sm px-2.5 py-0.5 -skew-x-12 ${
                      outcome === "sieg" ? "bg-primary text-white" : "bg-white/15 text-white/90"
                    }`}
                  >
                    <span className="inline-block skew-x-12">{OUTCOME_LABEL[outcome]}</span>
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
            </motion.div>
          )}
        </div>

        {/* ── Links ──────────────────────────────────────────────────── */}
        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/spielplan"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-white font-bold uppercase tracking-widest text-[13px] px-7 py-3.5 rounded-sm transition-colors"
          >
            Kompletter Spielplan
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
