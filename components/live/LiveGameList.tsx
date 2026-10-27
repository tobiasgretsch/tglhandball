import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LOCALE_TAGS, type Locale } from "@/i18n/routing";
import { dateFormatter } from "@/lib/i18n/format";
import type { LiveGame } from "@/lib/live/types";

interface LiveGameListProps {
  title: string;
  games: LiveGame[];
  emptyText?: string;
}

function GameRow({ game }: { game: LiveGame }) {
  const t = useTranslations("liveGameList");
  const tag = LOCALE_TAGS[useLocale() as Locale];
  const when = dateFormatter(tag, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(game.scheduled));
  const hasScore = game.live || game.scoreHome + game.scoreGuest > 0;

  return (
    <li>
      <Link
        href={`/live/${game.meetingId}`}
        className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-[colors,transform] duration-100 active:scale-[0.99] motion-reduce:active:scale-100 hover:border-primary/40 dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="min-w-0">
          {game.league && (
            <p className="truncate text-[11px] font-bold uppercase tracking-[0.1em] text-primary dark:text-primary-glow">
              {game.league}
            </p>
          )}
          <p className="mt-0.5 text-sm font-bold leading-snug text-text dark:text-gray-100">
            {game.homeTeam} <span className="font-normal text-muted">–</span> {game.awayTeam}
          </p>
          <p className="mt-0.5 text-xs text-muted">{t("when", { date: when })}</p>
        </div>
        <div className="shrink-0 text-right">
          {game.live && (
            <span className="mb-1 inline-flex rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.12em] text-white">
              {t("live")}
            </span>
          )}
          {hasScore && (
            <p className="text-lg font-bold tabular-nums text-text dark:text-gray-100">
              {game.scoreHome}:{game.scoreGuest}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}

export default function LiveGameList({ title, games, emptyText }: LiveGameListProps) {
  if (games.length === 0 && !emptyText) return null;
  return (
    <div>
      <h2 className="mb-3 font-display text-xl font-bold uppercase italic text-text dark:text-gray-100">{title}</h2>
      {games.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-sm text-muted dark:bg-gray-800 dark:text-gray-300">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {games.map((game) => (
            <GameRow key={game.meetingId} game={game} />
          ))}
        </ul>
      )}
    </div>
  );
}
