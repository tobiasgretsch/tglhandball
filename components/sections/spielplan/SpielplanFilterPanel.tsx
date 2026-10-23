import { HIGHLIGHTS, HIGHLIGHT_LABEL } from "@/lib/live/highlights";
import { OUTCOME_LABEL, type Outcome } from "@/lib/match";
import { seasonLabel, type Ort, type SpielplanFilters, type Status } from "@/lib/spielplanFilter";
import FilterPill from "@/components/ui/FilterPill";

interface SpielplanFilterPanelProps {
  filters: SpielplanFilters;
  onChange: (patch: Partial<SpielplanFilters>) => void;
  /** Leagues of the current team and season; the group is hidden below two. */
  leagues: string[];
  /** Seasons that have games; the group is hidden below two. */
  seasons: number[];
  currentSeason: number;
}

const STATUS_OPTIONS: Array<{ value: Status; label: string }> = [
  { value: "live", label: "Live" },
  { value: "kommend", label: "Kommend" },
  { value: "beendet", label: "Beendet" },
];
const ORT_OPTIONS: Array<{ value: Ort; label: string }> = [
  { value: "heim", label: "Heimspiele" },
  { value: "auswaerts", label: "Auswärtsspiele" },
];
const RESULT_OPTIONS: Outcome[] = ["sieg", "unentschieden", "niederlage"];
const RESULT_LABEL: Record<Outcome, string> = {
  sieg: "Siege",
  unentschieden: OUTCOME_LABEL.unentschieden,
  niederlage: "Niederlagen",
};

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/** Tapping the active chip again clears that dimension. */
function toggled<T>(current: T | null, value: T): T | null {
  return current === value ? null : value;
}

export default function SpielplanFilterPanel({
  filters,
  onChange,
  leagues,
  seasons,
  currentSeason,
}: SpielplanFilterPanelProps) {
  return (
    <div
      id="spielplan-filter-panel"
      className="grid gap-5 rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:grid-cols-2 sm:p-5"
    >
      <Group label="Status">
        {STATUS_OPTIONS.map(({ value, label }) => (
          <FilterPill
            key={value}
            label={label}
            active={filters.status === value}
            onClick={() => onChange({ status: toggled(filters.status, value) })}
          />
        ))}
      </Group>

      <Group label="Ort">
        {ORT_OPTIONS.map(({ value, label }) => (
          <FilterPill
            key={value}
            label={label}
            active={filters.ort === value}
            onClick={() => onChange({ ort: toggled(filters.ort, value) })}
          />
        ))}
      </Group>

      <Group label="Ergebnis aus Sicht der TG">
        {RESULT_OPTIONS.map((value) => (
          <FilterPill
            key={value}
            label={RESULT_LABEL[value]}
            active={filters.ergebnis === value}
            onClick={() => onChange({ ergebnis: toggled(filters.ergebnis, value) })}
          />
        ))}
      </Group>

      <Group label="Besondere Spiele">
        {HIGHLIGHTS.map((value) => (
          <FilterPill
            key={value}
            label={HIGHLIGHT_LABEL[value]}
            active={filters.tag === value}
            onClick={() => onChange({ tag: toggled(filters.tag, value) })}
          />
        ))}
      </Group>

      {leagues.length > 1 && (
        <Group label="Liga">
          {leagues.map((league) => (
            <FilterPill
              key={league}
              label={league}
              active={filters.liga === league}
              onClick={() => onChange({ liga: toggled(filters.liga, league) })}
            />
          ))}
        </Group>
      )}

      {seasons.length > 1 && (
        <Group label="Saison">
          {seasons.map((season) => (
            <FilterPill
              key={season}
              label={seasonLabel(season)}
              active={(filters.saison ?? currentSeason) === season}
              onClick={() => onChange({ saison: season === currentSeason ? null : season, monat: null })}
            />
          ))}
        </Group>
      )}
    </div>
  );
}
