import type { StandingRow } from "@/lib/nuliga/standings";

const CLUB_NAME_PREFIX = "TG Landshut";

interface Props {
  rows: StandingRow[];
  sourceUrl: string;
}

const HEAD = "px-2 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted";
const CELL = "px-2 py-3 text-center tabular-nums";
/** Detail columns are hidden on narrow screens. */
const WIDE = "hidden sm:table-cell";

export default function StandingsTable({ rows, sourceUrl }: Props) {
  return (
    <div className="mt-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_16px_40px_-16px_rgb(0_0_0/0.2)] bg-white dark:bg-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-text dark:text-gray-100">
          <caption className="sr-only">Ligatabelle</caption>
          <thead className="bg-background dark:bg-gray-700/60">
            <tr>
              <th scope="col" className={`${HEAD} w-10 text-center`}>#</th>
              <th scope="col" className={`${HEAD} text-left`}>Mannschaft</th>
              <th scope="col" className={`${HEAD} text-center`}>Sp.</th>
              <th scope="col" className={`${HEAD} text-center ${WIDE}`}>S</th>
              <th scope="col" className={`${HEAD} text-center ${WIDE}`}>U</th>
              <th scope="col" className={`${HEAD} text-center ${WIDE}`}>N</th>
              <th scope="col" className={`${HEAD} text-center`}>Tore</th>
              <th scope="col" className={`${HEAD} text-center ${WIDE}`}>+/-</th>
              <th scope="col" className={`${HEAD} text-center`}>Pkt.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isClub = row.team.startsWith(CLUB_NAME_PREFIX);
              return (
                <tr
                  key={`${row.rank}-${row.team}`}
                  className={`border-t border-gray-100 dark:border-gray-700 ${
                    isClub ? "bg-primary/10 font-semibold" : ""
                  }`}
                  aria-current={isClub ? "true" : undefined}
                >
                  <td className={CELL}>{row.rank}</td>
                  <td className="px-2 py-3 text-left">{row.team}</td>
                  <td className={CELL}>{row.games}</td>
                  <td className={`${CELL} ${WIDE}`}>{row.wins}</td>
                  <td className={`${CELL} ${WIDE}`}>{row.draws}</td>
                  <td className={`${CELL} ${WIDE}`}>{row.losses}</td>
                  <td className={CELL}>{row.goals}</td>
                  <td className={`${CELL} ${WIDE}`}>{row.goalDiff}</td>
                  <td className={`${CELL} font-semibold`}>{row.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-3 text-xs text-muted border-t border-gray-100 dark:border-gray-700">
        Quelle:{" "}
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
          nuLiga
        </a>
      </p>
    </div>
  );
}
