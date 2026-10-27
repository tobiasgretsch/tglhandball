"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { HIGHLIGHTS } from "@/lib/live/highlights";
import type { Outcome } from "@/lib/match";
import { seasonLabel, type Ort, type SpielplanFilters, type Status } from "@/lib/spielplanFilter";
import FilterPill from "@/components/ui/FilterPill";

interface SpielplanFilterSheetProps {
  open: boolean;
  onClose: () => void;
  /** Games the current filters leave, shown on the confirm button. */
  resultCount: number;
  onReset: () => void;
  canReset: boolean;
  /** Months of the current team and season, already labelled; the group is hidden below two. */
  months: Array<{ key: string; label: string }>;
  filters: SpielplanFilters;
  onChange: (patch: Partial<SpielplanFilters>) => void;
  /** Leagues of the current team and season; the group is hidden below two. */
  leagues: string[];
  /** Seasons that have games; the group is hidden below two. */
  seasons: number[];
  currentSeason: number;
}

const STATUS_OPTIONS = [
  { value: "live", label: "statusLive" },
  { value: "kommend", label: "statusUpcoming" },
  { value: "beendet", label: "statusFinished" },
] as const satisfies ReadonlyArray<{ value: Status; label: string }>;
const ORT_OPTIONS = [
  { value: "heim", label: "home" },
  { value: "auswaerts", label: "away" },
] as const satisfies ReadonlyArray<{ value: Ort; label: string }>;
const RESULT_OPTIONS = [
  { value: "sieg", label: "wins" },
  { value: "unentschieden", label: "draws" },
  { value: "niederlage", label: "losses" },
] as const satisfies ReadonlyArray<{ value: Outcome; label: string }>;

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

const CLOSE_ANIMATION_FALLBACK_MS = 400;

/**
 * Filters beyond the team pills. A bottom sheet on phones, a centred card from `sm:`.
 * Built on <dialog>, so focus trap, Esc and an inert page behind it come from the browser.
 */
export default function SpielplanFilterSheet({
  open,
  onClose,
  resultCount,
  onReset,
  canReset,
  months,
  filters,
  onChange,
  leagues,
  seasons,
  currentSeason,
}: SpielplanFilterSheetProps) {
  const t = useTranslations("spielplanFilters");
  const highlightT = useTranslations("highlight");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.removeAttribute("data-closing");
      dialog.showModal();
      // Start on the sheet itself, not on the first button (which would show a focus ring).
      dialog.focus();
      document.body.style.overflow = "hidden";
    }
    if (!open && dialog.open) {
      // Leave the way it came (slide back down), then close for real.
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) {
        dialog.close();
      } else {
        dialog.setAttribute("data-closing", "");
        const finish = () => {
          // A reopen in the meantime removes the marker; then there is nothing to finish.
          if (dialog.hasAttribute("data-closing")) dialog.close();
        };
        window.setTimeout(finish, CLOSE_ANIMATION_FALLBACK_MS);
        dialog.addEventListener("animationend", finish, { once: true });
      }
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="spielplan-filter-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      tabIndex={-1}
      className="filter-sheet m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-hidden rounded-t-3xl border-0 bg-background p-0 text-text shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm dark:bg-gray-900 dark:text-gray-100 sm:m-auto sm:max-w-xl sm:rounded-3xl"
    >
      {open && (
        <div className="flex max-h-[88dvh] flex-col">
          <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
            <h2 id="spielplan-filter-title" className="text-lg font-black">
              {t("title")}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onReset}
                disabled={!canReset}
                className="press min-h-11 rounded-full px-3 disabled:opacity-40 text-sm font-semibold text-brand-red underline-offset-4 hover:underline"
              >
                {t("reset")}
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("close")}
                className="press flex size-11 items-center justify-center rounded-full text-muted hover:text-text dark:hover:text-gray-100"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid gap-6 overflow-y-auto overscroll-contain px-5 pb-4 sm:grid-cols-2">
            {months.length > 1 && (
              <div className="sm:col-span-2">
                <Group label={t("month")}>
                  {months.map(({ key, label }) => (
                    <FilterPill
                      key={key}
                      label={label}
                      active={filters.monat === key}
                      onClick={() => onChange({ monat: toggled(filters.monat, key) })}
                    />
                  ))}
                </Group>
              </div>
            )}

            <Group label={t("status")}>
              {STATUS_OPTIONS.map(({ value, label }) => (
                <FilterPill
                  key={value}
                  label={t(label)}
                  active={filters.status === value}
                  onClick={() => onChange({ status: toggled(filters.status, value) })}
                />
              ))}
            </Group>

            <Group label={t("location")}>
              {ORT_OPTIONS.map(({ value, label }) => (
                <FilterPill
                  key={value}
                  label={t(label)}
                  active={filters.ort === value}
                  onClick={() => onChange({ ort: toggled(filters.ort, value) })}
                />
              ))}
            </Group>

            <Group label={t("result")}>
              {RESULT_OPTIONS.map(({ value, label }) => (
                <FilterPill
                  key={value}
                  label={t(label)}
                  active={filters.ergebnis === value}
                  onClick={() => onChange({ ergebnis: toggled(filters.ergebnis, value) })}
                />
              ))}
            </Group>

            <Group label={t("highlights")}>
              {HIGHLIGHTS.map((value) => (
                <FilterPill
                  key={value}
                  label={highlightT(value)}
                  active={filters.tag === value}
                  onClick={() => onChange({ tag: toggled(filters.tag, value) })}
                />
              ))}
            </Group>

            {leagues.length > 1 && (
              <Group label={t("league")}>
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
              <Group label={t("season")}>
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

          <div className="border-t border-gray-200 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="press min-h-12 w-full rounded-full bg-primary px-5 text-base font-bold text-white hover:bg-primary-light"
            >
              {t("showGames", { count: resultCount })}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
