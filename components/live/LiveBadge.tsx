"use client";

import Link from "next/link";
import { useMemo } from "react";
import { findGameForFixture } from "@/lib/live/fixture";
import type { LiveGame } from "@/lib/live/types";
import { useLiveGames } from "./LiveProvider";

interface PillProps {
  href: string;
  label: string;
  /** "light" sits on the red header, "solid" on white cards. */
  tone: "light" | "solid";
  ariaLabel: string;
}

const TONE_CLASS = {
  light: "bg-white text-primary hover:bg-white/90",
  solid: "bg-primary text-white hover:bg-primary-light",
} as const;

const DOT_CLASS = {
  light: "bg-primary",
  solid: "bg-white",
} as const;

function LivePill({ href, label, tone, ariaLabel }: PillProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black uppercase leading-none tracking-[0.12em] tabular-nums transition-colors ${TONE_CLASS[tone]}`}
    >
      <span className="relative flex size-2" aria-hidden="true">
        <span
          className={`absolute inline-flex size-full rounded-full opacity-60 animate-ping motion-reduce:animate-none ${DOT_CLASS[tone]}`}
        />
        <span className={`relative inline-flex size-2 rounded-full ${DOT_CLASS[tone]}`} />
      </span>
      {label}
    </Link>
  );
}

const tickerHref = (game: LiveGame) => `/live/${game.meetingId}`;

/** Header badge: appears only while at least one TG game is live. */
export function LiveNavBadge({ className = "" }: { className?: string }) {
  const { liveGames } = useLiveGames();
  if (liveGames.length === 0) return null;

  const [only] = liveGames;
  const single = liveGames.length === 1;
  return (
    <span className={className}>
      <LivePill
        href={single ? tickerHref(only) : "/live"}
        label="Live"
        tone="light"
        ariaLabel={
          single
            ? `Live-Ticker: ${only.homeTeam} gegen ${only.awayTeam}`
            : `${liveGames.length} Spiele live – zum Live-Ticker`
        }
      />
    </span>
  );
}

interface LiveMatchBadgeProps {
  match: { homeTeam: string; awayTeam: string; date: string };
}

/** Marks a fixture of our own schedule while its game is live, with the running score. */
export function LiveMatchBadge({ match }: LiveMatchBadgeProps) {
  const { liveGames } = useLiveGames();
  const game = useMemo(
    () => findGameForFixture(liveGames, match),
    [liveGames, match],
  );
  if (!game) return null;

  return (
    <LivePill
      href={tickerHref(game)}
      label={`Live ${game.scoreHome}:${game.scoreGuest}`}
      tone="solid"
      ariaLabel={`Live-Ticker: ${game.homeTeam} gegen ${game.awayTeam}, Stand ${game.scoreHome} zu ${game.scoreGuest}`}
    />
  );
}
