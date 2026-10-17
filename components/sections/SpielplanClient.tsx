"use client";

import { useState, useMemo } from "react";
import { MapPin } from "lucide-react";
import type { Match } from "@/types";
import { CLUB_TIME_ZONE } from "@/lib/dates";
import { OUTCOME_LABEL, tgOutcome, type Outcome } from "@/lib/match";
import MatchReportButton from "@/components/ui/MatchReportButton";
import AddToCalendarButton from "@/components/ui/AddToCalendarButton";
import { LiveMatchBadge } from "@/components/live/LiveBadge";

interface TeamOption {
  _id: string;
  name: string;
}

interface SpielplanClientProps {
  matches: Match[];
  teams: TeamOption[];
}

interface DayGroup {
  /** Calendar day in club time zone, e.g. "2026-10-17" — stable grouping key. */
  key: string;
  label: string;
  matches: Match[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: CLUB_TIME_ZONE });

const dayLabelFormat = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: CLUB_TIME_ZONE,
});

const timeFormat = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: CLUB_TIME_ZONE,
});

/** Groups already-sorted matches by calendar day, preserving order. */
function groupByDay(matches: Match[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const match of matches) {
    const date = new Date(match.date);
    const key = dayKeyFormat.format(date);
    const last = groups[groups.length - 1];
    if (last?.key === key) {
      last.matches.push(match);
    } else {
      groups.push({ key, label: dayLabelFormat.format(date), matches: [match] });
    }
  }
  return groups;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SpielplanClient({ matches, teams }: SpielplanClientProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      selectedTeamId
        ? matches.filter((m) => m.team?._id === selectedTeamId)
        : matches,
    [matches, selectedTeamId]
  );

  const upcoming = useMemo(
    () => filtered.filter((m) => !m.result),
    [filtered]
  );

  const results = useMemo(
    () =>
      filtered
        .filter((m) => Boolean(m.result))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10),
    [filtered]
  );

  return (
    <div className="bg-background dark:bg-gray-900 min-h-[60vh]">
      {/* ── Filter bar ───────────────────────────────────────────────── */}
      <div className="material-bar sticky top-[54px] lg:top-[60px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            <FilterPill
              label="Alle Teams"
              active={selectedTeamId === null}
              onClick={() => setSelectedTeamId(null)}
            />
            {teams.map((team) => (
              <FilterPill
                key={team._id}
                label={team.name}
                active={selectedTeamId === team._id}
                onClick={() =>
                  setSelectedTeamId(
                    selectedTeamId === team._id ? null : team._id
                  )
                }
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-14">
        <MatchSection
          title="Kommende Spiele"
          matches={upcoming}
          emptyText="Keine bevorstehenden Spiele gefunden."
          isResult={false}
        />
        <MatchSection
          title="Ergebnisse"
          matches={results}
          emptyText="Keine Ergebnisse gefunden."
          isResult={true}
        />
      </div>
    </div>
  );
}

// ─── Filter pill ─────────────────────────────────────────────────────────────

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`press shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors border ${
        active
          ? "bg-primary border-primary text-white shadow-[0_8px_24px_-8px_rgb(218_37_28/0.55)]"
          : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-muted dark:text-gray-300 hover:border-primary hover:text-primary dark:hover:text-primary-glow"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function MatchSection({
  title,
  matches,
  emptyText,
  isResult,
}: {
  title: string;
  matches: Match[];
  emptyText: string;
  isResult: boolean;
}) {
  const groups = useMemo(() => groupByDay(matches), [matches]);

  return (
    <section aria-label={title}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
        <span
          aria-hidden="true"
          className={`block w-2 h-2 rounded-full shrink-0 ${
            isResult ? "bg-accent" : "bg-primary"
          }`}
        />
        <h2 className="font-display font-bold italic uppercase text-2xl md:text-3xl tracking-[-0.02em] text-text dark:text-gray-100">
          {title}
        </h2>
        {matches.length > 0 && (
          <span className="inline-flex items-center gap-2 text-xs text-muted sm:ml-auto">
            <span aria-hidden="true" className="block w-1 h-4 rounded-full bg-primary" />
            Heimspiel
          </span>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="text-muted text-sm py-6">{emptyText}</p>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.key}>
              <h3 className="px-1 mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">
                {group.label}
              </h3>
              <ul className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_16px_40px_-20px_rgb(0_0_0/0.2)] overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
                {group.matches.map((match) => (
                  <MatchRow key={match._id} match={match} isResult={isResult} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Match row ────────────────────────────────────────────────────────────────

const OUTCOME_CLASS: Record<Outcome, string> = {
  sieg: "text-primary dark:text-primary-glow",
  niederlage: "text-muted",
  unentschieden: "text-text dark:text-gray-100",
};

/** One layout for all breakpoints: lead (time/score) · matchup · venue · actions. */
function MatchRow({ match, isResult }: { match: Match; isResult: boolean }) {
  const outcome = isResult ? tgOutcome(match) : null;
  const tgIsHome = match.isHomeGame === true;
  const tgIsAway = match.isHomeGame === false;
  const sideClass = (isTg: boolean) =>
    isTg
      ? "font-bold text-text dark:text-gray-100"
      : "font-medium text-text/70 dark:text-gray-300";

  return (
    <li
      className={`grid grid-cols-[3.75rem_minmax(0,1fr)_auto] md:grid-cols-[5rem_minmax(0,1fr)_15rem_auto] items-center gap-x-3 md:gap-x-5 gap-y-1 py-3.5 pr-3 md:pr-5 border-l-4 hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors ${
        tgIsHome ? "border-primary pl-3 md:pl-4" : "border-transparent pl-3 md:pl-4"
      }`}
    >
      {/* Lead: kick-off time, or the score for results */}
      <div className="row-span-2 md:row-span-1 text-center">
        {isResult ? (
          <>
            <span
              className={`text-lg font-black tabular-nums ${
                outcome ? OUTCOME_CLASS[outcome] : "text-text dark:text-gray-100"
              }`}
            >
              {match.result ?? "–:–"}
            </span>
            {outcome && <span className="sr-only"> {OUTCOME_LABEL[outcome]}</span>}
          </>
        ) : (
          <>
            <span className="text-lg font-black tabular-nums text-text dark:text-gray-100">
              {timeFormat.format(new Date(match.date))}
            </span>
            <span className="block text-[11px] leading-none text-muted">
              Uhr
            </span>
          </>
        )}
      </div>

      {/* Matchup */}
      <div className="min-w-0">
        {match.team?.name && (
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary dark:text-primary-glow leading-tight mb-0.5">
            {match.team.name}
            {match.isHomeGame !== undefined && (
              <span className="sr-only">{tgIsHome ? ", Heimspiel" : ", Auswärtsspiel"}</span>
            )}
          </p>
        )}
        <p className="text-sm leading-snug text-balance">
          <span className={sideClass(tgIsHome)}>{match.homeTeam}</span>
          <span className="mx-1.5 text-muted" aria-hidden="true">
            –
          </span>
          <span className="sr-only"> gegen </span>
          <span className={sideClass(tgIsAway)}>{match.awayTeam}</span>
        </p>
      </div>

      {/* Venue — below the matchup on mobile, own column on desktop */}
      <div className="col-start-2 md:col-start-3 md:row-start-1 min-w-0">
        {match.venue && (
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <MapPin size={12} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{match.venue}</span>
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="col-start-3 row-start-1 row-span-2 md:col-start-4 md:row-span-1 flex items-center justify-end gap-2">
        <LiveMatchBadge match={match} />
        {isResult && match.meetingId && <MatchReportButton meetingId={match.meetingId} />}
        {!isResult && <AddToCalendarButton match={match} compact />}
      </div>
    </li>
  );
}
