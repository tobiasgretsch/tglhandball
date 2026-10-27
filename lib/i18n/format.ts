import { CLUB_TIME_ZONE } from "@/lib/dates";

/**
 * Locale-aware formatters. Every date formatter pins `timeZone` so server (UTC) and
 * browser render the same text — otherwise React hydration mismatches (see lessons).
 * Pass the BCP 47 tag from `useLocale()` / `getLocale()` mapped through `LOCALE_TAGS`.
 */
export function dateFormatter(tag: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(tag, { timeZone: CLUB_TIME_ZONE, ...options });
}

export function currencyFormatter(tag: string, currency = "EUR"): Intl.NumberFormat {
  return new Intl.NumberFormat(tag, { style: "currency", currency });
}

export function compareText(tag: string, a: string, b: string): number {
  return a.localeCompare(b, tag);
}
