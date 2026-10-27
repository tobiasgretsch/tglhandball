"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { REGULAR_PERIODS } from "@/lib/live/events";
import type { TickerEntry, TickerSnapshot } from "@/lib/live/types";

/** Turns the stable codes of the ticker data into text in the visitor's language. */
export function useLiveLabels() {
  const entryT = useTranslations("liveEntry");
  const statusT = useTranslations("liveStatus");

  const periodName = useCallback(
    (period: number): string =>
      period <= REGULAR_PERIODS
        ? entryT("half", { n: period })
        : entryT("extraTime", { n: period - REGULAR_PERIODS }),
    [entryT],
  );

  const entryLabel = useCallback(
    ({ label, period }: Pick<TickerEntry, "label" | "period">): string => {
      if (label === "periodStart") return entryT("periodStart", { period: periodName(period) });
      if (label === "extraTimeEnd") return entryT("extraTimeEnd", { period: periodName(period) });
      return entryT(label);
    },
    [entryT, periodName],
  );

  const statusLabel = useCallback(
    ({ statusLabel: label, statusPeriod }: Pick<TickerSnapshot, "statusLabel" | "statusPeriod">): string =>
      label === "periodRunning" ? statusT(label, { period: periodName(statusPeriod) }) : statusT(label),
    [statusT, periodName],
  );

  return { entryLabel, statusLabel };
}
