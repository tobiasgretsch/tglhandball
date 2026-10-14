"use client";

import { CalendarPlus } from "lucide-react";
import type { Match } from "@/types";
import { buildMatchIcs, matchIcsFilename } from "@/lib/calendar";

interface AddToCalendarButtonProps {
  match: Match;
  /** Visual variant: "glass" on dark backgrounds, "light" on white cards. */
  tone?: "glass" | "light";
  /** Icon-only round button with a tooltip, for crowded cards and table rows. */
  compact?: boolean;
}

const LABEL = "Zum Kalender hinzufügen";

const TONE_CLASS = {
  glass: "btn btn-glass",
  light: "btn bg-accent hover:bg-accent-deep",
} as const;

/** Downloads an .ics file so the match can be added to any calendar app. */
export default function AddToCalendarButton({ match, tone = "light", compact = false }: AddToCalendarButtonProps) {
  function download() {
    const blob = new Blob([buildMatchIcs(match)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = matchIcsFilename(match);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      title={LABEL}
      aria-label={`${LABEL}: ${match.homeTeam} gegen ${match.awayTeam}`}
      className={`${TONE_CLASS[tone]} text-xs! whitespace-nowrap ${
        compact ? "size-9! p-0!" : "px-3.5! py-1.5!"
      }`}
    >
      <CalendarPlus size={compact ? 16 : 13} aria-hidden="true" />
      {!compact && LABEL}
    </button>
  );
}
