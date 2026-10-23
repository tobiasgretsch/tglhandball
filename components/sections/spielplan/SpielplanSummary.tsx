import type { Outcome } from "@/lib/match";
import { OUTCOME_LABEL } from "@/lib/match";
import type { Balance } from "@/lib/spielplanFilter";

const FORM_DOT_CLASS: Record<Outcome, string> = {
  sieg: "bg-green-600",
  unentschieden: "bg-gray-400",
  niederlage: "bg-primary",
};

const FORM_LETTER: Record<Outcome, string> = { sieg: "S", unentschieden: "U", niederlage: "N" };

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="mt-1 text-lg font-black tabular-nums text-text dark:text-gray-100">{children}</dd>
    </div>
  );
}

/** Record of the games currently listed — follows every filter, so it answers "how did we do against …?". */
export default function SpielplanSummary({ balance }: { balance: Balance }) {
  const played = balance.wins + balance.draws + balance.losses;
  if (played === 0) return null;
  const difference = balance.goalsFor - balance.goalsAgainst;

  return (
    <section
      aria-label="Bilanz der angezeigten Spiele"
      className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:p-5"
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
        <Stat label="Spiele">{played}</Stat>
        <Stat label="Bilanz (S-U-N)">
          {balance.wins}-{balance.draws}-{balance.losses}
        </Stat>
        <Stat label="Tore">
          {balance.goalsFor}:{balance.goalsAgainst}{" "}
          <span className="text-xs font-bold text-muted">
            ({difference > 0 ? "+" : ""}
            {difference})
          </span>
        </Stat>
        <Stat label="Form">
          <ol className="flex items-center gap-1.5" aria-label="Letzte Ergebnisse, ältestes zuerst">
            {balance.form.map((outcome, index) => (
              <li
                key={index}
                title={OUTCOME_LABEL[outcome]}
                className={`flex size-6 items-center justify-center rounded-full text-[11px] font-black text-white ${FORM_DOT_CLASS[outcome]}`}
              >
                <span aria-hidden="true">{FORM_LETTER[outcome]}</span>
                <span className="sr-only">{OUTCOME_LABEL[outcome]}</span>
              </li>
            ))}
          </ol>
        </Stat>
      </dl>
    </section>
  );
}
