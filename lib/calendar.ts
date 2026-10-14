import type { Match } from "@/types";

/** Handball matches have no end time in the data — assume a typical slot. */
const MATCH_DURATION_MS = 2 * 60 * 60 * 1000;
const CRLF = "\r\n";
const UID_DOMAIN = "tglhandball.de";
const PRODUCT_ID = "-//TG MIPA Landshut//Spielplan//DE";

/** 2026-10-14T18:30:00.000Z → 20261014T183000Z */
function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** RFC 5545 §3.3.11 text escaping. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function buildMatchIcs(match: Match): string {
  const start = new Date(match.date);
  const end = new Date(start.getTime() + MATCH_DURATION_MS);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODUCT_ID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${match._id}@${UID_DOMAIN}`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeText(`${match.homeTeam} – ${match.awayTeam}`)}`,
    ...(match.venue ? [`LOCATION:${escapeText(match.venue)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join(CRLF) + CRLF;
}

export function matchIcsFilename(match: Match): string {
  return `spiel-${match.date.slice(0, 10)}.ics`;
}
