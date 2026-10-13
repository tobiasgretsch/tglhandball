/**
 * Pure parser for the nuLiga club page ("clubInfoDisplay").
 * Input: raw HTML. Output: one entry per fixture row, no I/O.
 */

export interface NuligaMatch {
  /** Stable identifier — survives rescheduling, unique per fixture. */
  key: string;
  /** ISO-8601 with Europe/Berlin offset, or null for "Termin offen". */
  date: string | null;
  league: string;
  homeTeam: string;
  awayTeam: string;
  venue?: string;
  /** "28:24" — only set once the game was actually played. */
  result?: string;
  isHomeGame: boolean;
}

const CLUB_NAME_PREFIX = "TG Landshut";
const TOURNAMENT_PREFIX = "Spieltag";
const SCORE_PATTERN = /^\d+:\d+$/;
const UNPLAYED_SCORE = "0:0";
const DATE_PATTERN = /^(\d{2})\.(\d{2})\.(\d{4})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})/;
const MEETING_REPORT_MARKER = "clubMeetingReport";
const OPEN_DATE_COLSPAN = /colspan="2"/;

/** Column positions once the two date cells are normalised (see `readCells`). */
const COL = {
  date: 1,
  time: 2,
  venue: 3,
  number: 4,
  league: 5,
  home: 6,
  away: 7,
  score: 8,
} as const;

interface Cell {
  attrs: string;
  html: string;
  text: string;
}

const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

function decodeEntities(value: string): string {
  return value.replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g, (m) => HTML_ENTITIES[m]);
}

function toText(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

/**
 * Rows start with two date cells (weekday, date). They are either filled,
 * blank rowspan filler (inherit the previous row's date), or a single
 * `colspan="2"` cell reading "Termin offen". Normalise all three to two cells.
 */
function readCells(rowHtml: string): Cell[] {
  const cells: Cell[] = [];
  const cellPattern = /<td([^>]*)>([\s\S]*?)<\/td>/g;
  for (const m of rowHtml.matchAll(cellPattern)) {
    cells.push({ attrs: m[1], html: m[2], text: toText(m[2]) });
  }
  if (cells[0] && OPEN_DATE_COLSPAN.test(cells[0].attrs)) {
    const blank: Cell = { attrs: "", html: "", text: "" };
    cells.splice(0, 1, blank, blank);
  }
  return cells;
}

/** Converts a Europe/Berlin wall-clock time to an ISO string with offset. */
export function berlinToIso(day: string, time: string): string {
  const d = DATE_PATTERN.exec(day);
  const t = TIME_PATTERN.exec(time);
  if (!d || !t) throw new Error(`Unparseable date/time: "${day}" "${time}"`);
  const [year, month, dom] = [Number(d[3]), Number(d[2]), Number(d[1])];
  const [hour, minute] = [Number(t[1]), Number(t[2])];

  // Find the Berlin UTC offset for that instant by probing with Intl.
  const asUtc = Date.UTC(year, month - 1, dom, hour, minute);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).formatToParts(new Date(asUtc));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const berlinAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  const offsetMinutes = Math.round((berlinAsUtc - asUtc) / 60000);

  return new Date(asUtc - offsetMinutes * 60000).toISOString();
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildKey(number: string, league: string, awayTeam: string, day: string | null): string {
  // Tournament days ("Spieltag …") reuse a short running number across dates.
  const isTournament = awayTeam.startsWith(TOURNAMENT_PREFIX);
  const suffix = isTournament && day ? `-${day.split(".").reverse().join("")}` : "";
  return `${slug(number)}-${slug(league)}${suffix}`;
}

/** At a tournament day ("Spieltag X") the named host decides home vs. away. */
function isClubHome(homeTeam: string, awayTeam: string): boolean {
  if (awayTeam.startsWith(TOURNAMENT_PREFIX)) return false;
  if (homeTeam.startsWith(TOURNAMENT_PREFIX)) return true;
  return homeTeam.startsWith(CLUB_NAME_PREFIX);
}

function readResult(cell: Cell | undefined): string | undefined {
  if (!cell || !SCORE_PATTERN.test(cell.text)) return undefined;
  // nuLiga shows 0:0 for games not yet played; a real 0:0 has a match report.
  const hasReport = cell.html.includes(MEETING_REPORT_MARKER);
  return cell.text === UNPLAYED_SCORE && !hasReport ? undefined : cell.text;
}

function readVenue(cell: Cell | undefined): string | undefined {
  const title = cell && /title="([^"]*)"/.exec(cell.html)?.[1];
  return title ? decodeEntities(title).trim() || undefined : undefined;
}

/** Parses every fixture row on the page (both "Rückschau" and "Vorschau"). */
export function parseClubPage(html: string): NuligaMatch[] {
  const matches: NuligaMatch[] = [];
  let currentDay: string | null = null;

  for (const row of html.split(/<tr[\s>]/).slice(1)) {
    const cells = readCells(row);
    if (cells.length <= COL.away) continue; // header row or layout row

    const league = cells[COL.league].text;
    const homeTeam = cells[COL.home].text;
    const awayTeam = cells[COL.away].text;
    if (!league || !homeTeam || !awayTeam) continue;

    const dayText = cells[COL.date].text;
    const isDateRow = DATE_PATTERN.test(dayText);
    const isOpenRow = cells[0].text === "" && cells[1].text === "" && row.includes('colspan="2"');
    if (isDateRow) currentDay = dayText;
    const day = isOpenRow ? null : currentDay;

    const number = cells[COL.number].text;
    const time = cells[COL.time].text;
    const date = day && TIME_PATTERN.test(time) ? berlinToIso(day, time) : null;

    matches.push({
      key: buildKey(number, league, awayTeam, day),
      date,
      league,
      homeTeam,
      awayTeam,
      venue: readVenue(cells[COL.venue]),
      result: readResult(cells[COL.score]),
      isHomeGame: isClubHome(homeTeam, awayTeam),
    });
  }
  return matches;
}
