"use client";

import { useState, useMemo } from "react";
import { MapPin, Home, Plane } from "lucide-react";
import type { Match } from "@/types";

interface TeamOption {
  _id: string;
  name: string;
}

interface SpielplanClientProps {
  matches: Match[];
  teams: TeamOption[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(dateStr: string): { date: string; time: string } {
  const d = new Date(dateStr);
  const date = new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return { date, time };
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
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-[68px] lg:top-[76px] z-40">
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
      className={`shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wide transition-colors border ${
        active
          ? "bg-primary border-primary text-white shadow-sm shadow-primary/20"
          : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-muted dark:text-gray-400 hover:border-primary hover:text-primary"
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
  return (
    <section>
      <div className="flex items-center gap-4 mb-6">
        <span
          className={`block w-8 h-[3px] rounded-full shrink-0 ${
            isResult ? "bg-accent" : "bg-primary"
          }`}
        />
        <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted dark:text-gray-400">
          {title}
        </h2>
      </div>

      {matches.length === 0 ? (
        <p className="text-muted dark:text-gray-400 text-sm py-6">{emptyText}</p>
      ) : (
        <>
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <MatchTable matches={matches} isResult={isResult} />
          </div>
          <div className="md:hidden space-y-3">
            {matches.map((match) => (
              <MatchCard key={match._id} match={match} isResult={isResult} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ─── Desktop table ────────────────────────────────────────────────────────────

function MatchTable({
  matches,
  isResult,
}: {
  matches: Match[];
  isResult: boolean;
}) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-gray-100 dark:border-gray-700 text-[10px] font-bold uppercase tracking-widest text-muted dark:text-gray-400">
          <th className="text-left px-5 py-3 w-[220px]">Datum &amp; Zeit</th>
          <th className="text-right px-3 py-3">Heim</th>
          <th className="text-center px-3 py-3 w-[80px]">
            {isResult ? "Ergebnis" : "Uhrzeit"}
          </th>
          <th className="text-left px-3 py-3">Auswärts</th>
          <th className="text-left px-3 py-3 hidden lg:table-cell">Spielstätte</th>
          <th className="text-center px-5 py-3 w-[80px]">Typ</th>
        </tr>
      </thead>
      <tbody>
        {matches.map((match, i) => (
          <MatchTableRow
            key={match._id}
            match={match}
            isResult={isResult}
            striped={i % 2 === 1}
          />
        ))}
      </tbody>
    </table>
  );
}

function MatchTableRow({
  match,
  isResult,
  striped,
}: {
  match: Match;
  isResult: boolean;
  striped: boolean;
}) {
  const { date, time } = formatDateTime(match.date);
  const tglIsHome = match.isHomeGame === true;
  const tglIsAway = match.isHomeGame === false;

  return (
    <tr
      className={`border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-700/50 ${
        striped
          ? "bg-gray-50/40 dark:bg-gray-700/20"
          : "bg-white dark:bg-gray-800"
      }`}
    >
      <td className="px-5 py-4 text-text/70 dark:text-gray-300 text-[13px] leading-tight">
        <span className="block">{date}</span>
        <span className="block text-muted dark:text-gray-400 text-[11px] mt-0.5">{time} Uhr</span>
      </td>
      <td className="px-3 py-4 text-right">
        <span
          className={`font-bold text-[13px] leading-tight ${
            tglIsHome ? "text-accent" : "text-text dark:text-gray-100"
          }`}
        >
          {match.homeTeam}
        </span>
      </td>
      <td className="px-3 py-4 text-center">
        {isResult ? (
          <span className="text-base font-black text-text dark:text-gray-100 tabular-nums">
            {match.result ?? "–:–"}
          </span>
        ) : (
          <span className="text-[13px] font-black text-primary tabular-nums">
            {time}
          </span>
        )}
      </td>
      <td className="px-3 py-4">
        <span
          className={`font-bold text-[13px] leading-tight ${
            tglIsAway ? "text-accent" : "text-text dark:text-gray-100"
          }`}
        >
          {match.awayTeam}
        </span>
      </td>
      <td className="px-3 py-4 hidden lg:table-cell">
        {match.venue && (
          <span className="flex items-center gap-1.5 text-[12px] text-muted dark:text-gray-400">
            <MapPin size={11} className="shrink-0" />
            {match.venue}
          </span>
        )}
      </td>
      <td className="px-5 py-4 text-center">
        <HomeAwayBadge isHomeGame={match.isHomeGame} />
      </td>
    </tr>
  );
}

// ─── Mobile card ─────────────────────────────────────────────────────────────

function MatchCard({ match, isResult }: { match: Match; isResult: boolean }) {
  const { date, time } = formatDateTime(match.date);
  const tglIsHome = match.isHomeGame === true;
  const tglIsAway = match.isHomeGame === false;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className={`h-[3px] ${isResult ? "bg-accent" : "bg-primary"}`} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] text-muted dark:text-gray-400 leading-tight">
            {date}
          </span>
          <HomeAwayBadge isHomeGame={match.isHomeGame} />
        </div>
        <div className="flex items-center gap-3">
          <p
            className={`flex-1 text-right font-bold text-sm leading-tight ${
              tglIsHome ? "text-accent" : "text-text dark:text-gray-100"
            }`}
          >
            {match.homeTeam}
          </p>
          <div className="shrink-0 text-center w-16">
            {isResult ? (
              <span className="text-lg font-black text-text dark:text-gray-100 tabular-nums">
                {match.result ?? "–:–"}
              </span>
            ) : (
              <div>
                <span className="text-base font-black text-primary tabular-nums block">
                  {time}
                </span>
                <span className="text-[10px] text-muted dark:text-gray-400">Uhr</span>
              </div>
            )}
          </div>
          <p
            className={`flex-1 font-bold text-sm leading-tight ${
              tglIsAway ? "text-accent" : "text-text dark:text-gray-100"
            }`}
          >
            {match.awayTeam}
          </p>
        </div>
        {match.venue && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <MapPin size={11} className="text-muted dark:text-gray-400 shrink-0" />
            <span className="text-[11px] text-muted dark:text-gray-400">{match.venue}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared badge ─────────────────────────────────────────────────────────────

function HomeAwayBadge({ isHomeGame }: { isHomeGame?: boolean }) {
  if (isHomeGame === undefined) return null;
  return isHomeGame ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded">
      <Home size={9} />
      Heim
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
      <Plane size={9} />
      Auswärts
    </span>
  );
}
