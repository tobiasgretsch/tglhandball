import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Activity, MapPin } from "lucide-react";
import type { Match } from "@/types";
import { Link } from "@/i18n/navigation";
import { LOCALE_TAGS, type Locale } from "@/i18n/routing";
import { dateFormatter } from "@/lib/i18n/format";
import { isHighlight } from "@/lib/live/highlights";
import { gamePagePath, tgOutcome, type Outcome } from "@/lib/match";
import MatchReportButton from "@/components/ui/MatchReportButton";
import AddToCalendarButton from "@/components/ui/AddToCalendarButton";
import { LiveMatchBadge } from "@/components/live/LiveBadge";

export const OUTCOME_CLASS: Record<Outcome, string> = {
  sieg: "text-primary dark:text-primary-glow",
  niederlage: "text-muted",
  unentschieden: "text-text dark:text-gray-100",
};

/** One layout for all breakpoints: lead (time/score) · matchup · venue · actions. */
export default function SpielplanMatchRow({ match, isResult }: { match: Match; isResult: boolean }) {
  const t = useTranslations("spielplanRow");
  const outcomeT = useTranslations("outcome");
  const highlightT = useTranslations("highlight");
  const tag = LOCALE_TAGS[useLocale() as Locale];
  const timeFormat = useMemo(() => dateFormatter(tag, { hour: "2-digit", minute: "2-digit" }), [tag]);
  const outcome = isResult ? tgOutcome(match) : null;
  const tgIsHome = match.isHomeGame === true;
  const tgIsAway = match.isHomeGame === false;
  const gamePath = gamePagePath(match);
  const highlights = (match.archive?.highlights ?? []).filter(isHighlight);
  const sideClass = (isTg: boolean) =>
    isTg
      ? "font-bold text-text dark:text-gray-100"
      : "font-medium text-text/70 dark:text-gray-300";

  return (
    <li
      className={`grid ${
        isResult ? "grid-cols-[3.75rem_minmax(0,1fr)]" : "grid-cols-[3.75rem_minmax(0,1fr)_auto]"
      } md:grid-cols-[5rem_minmax(0,1fr)_15rem_auto] items-center gap-x-3 md:gap-x-5 gap-y-1 py-3.5 pr-3 md:pr-5 border-l-4 hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors ${
        tgIsHome ? "border-primary pl-3 md:pl-4" : "border-transparent pl-3 md:pl-4"
      }`}
    >
      {/* Lead: kick-off time, or the score for results */}
      <div className={`${isResult ? "row-span-3" : "row-span-2"} md:row-span-1 text-center`}>
        {isResult ? (
          <>
            <span
              className={`text-lg font-black tabular-nums ${
                outcome ? OUTCOME_CLASS[outcome] : "text-text dark:text-gray-100"
              }`}
            >
              {match.result ?? "–:–"}
            </span>
            {outcome && <span className="sr-only"> {outcomeT(outcome)}</span>}
          </>
        ) : (
          <>
            <span className="text-lg font-black tabular-nums text-text dark:text-gray-100">
              {timeFormat.format(new Date(match.date))}
            </span>
            <span className="block text-[11px] leading-none text-muted">{t("kickoffSuffix")}</span>
          </>
        )}
      </div>

      {/* Matchup */}
      <div className="min-w-0">
        {match.team?.name && (
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary dark:text-primary-glow leading-tight mb-0.5">
            {match.team.name}
            {match.isHomeGame !== undefined && (
              <span className="sr-only">{tgIsHome ? t("homeGameSr") : t("awayGameSr")}</span>
            )}
          </p>
        )}
        <p className="text-sm leading-snug text-balance">
          <span className={sideClass(tgIsHome)}>{match.homeTeam}</span>
          <span className="mx-1.5 text-muted" aria-hidden="true">
            –
          </span>
          <span className="sr-only"> {t("versusSr")} </span>
          <span className={sideClass(tgIsAway)}>{match.awayTeam}</span>
        </p>
        {highlights.length > 0 && (
          <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label={t("highlightsLabel")}>
            {highlights.map((highlight) => (
              <li
                key={highlight}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-red"
              >
                {highlightT(highlight)}
              </li>
            ))}
          </ul>
        )}
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
      {/* Results keep their actions on a line of their own on phones: three buttons would squeeze the team names. */}
      <div
        className={`${
          isResult
            ? "col-start-2 row-start-3 mt-1.5 justify-start"
            : "col-start-3 row-start-1 row-span-2 justify-end"
        } md:col-start-4 md:row-start-1 md:row-span-1 md:mt-0 md:justify-end flex flex-wrap items-center gap-2`}
      >
        <LiveMatchBadge match={match} />
        {gamePath && (
          <Link
            href={gamePath}
            aria-label={t("historyLabel", { home: match.homeTeam, away: match.awayTeam })}
            className="press inline-flex min-h-9 items-center gap-1.5 rounded-full border border-gray-200 px-3 text-xs font-bold text-text transition-colors hover:border-primary hover:text-brand-red dark:border-gray-600 dark:text-gray-100"
          >
            <Activity size={14} aria-hidden="true" />
            <span className="sm:hidden">{t("historyShort")}</span>
            <span className="hidden sm:inline">{t("history")}</span>
          </Link>
        )}
        {isResult && match.meetingId && <MatchReportButton meetingId={match.meetingId} />}
        {!isResult && <AddToCalendarButton match={match} compact />}
      </div>
    </li>
  );
}
