/**
 * League table ("Tabelle") from a public nuLiga group page.
 * `parseStandings` is pure; `fetchStandings` adds the (cached) network call.
 */

export interface StandingRow {
  rank: string;
  team: string;
  games: string;
  wins: string;
  draws: string;
  losses: string;
  goals: string;
  goalDiff: string;
  points: string;
}

const ALLOWED_HOST = "bhv-handball.liga.nu";
const REVALIDATE_SECONDS = 900;
const FETCH_TIMEOUT_MS = 8000;
const TABLE_PATTERN = /<table[^>]*class="result-set"[^>]*>([\s\S]*?)<\/table>/;

/** nuLiga column header → row field. Columns are located by header, not index. */
const HEADER_FIELD: Record<string, keyof StandingRow> = {
  Rang: "rank",
  Mannschaft: "team",
  Begegnungen: "games",
  S: "wins",
  U: "draws",
  N: "losses",
  Tore: "goals",
  "+/-": "goalDiff",
  Punkte: "points",
};

const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

function toText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g, (m) => HTML_ENTITIES[m])
    .replace(/\s+/g, " ")
    .trim();
}

function readCells(rowHtml: string, tag: "td" | "th"): string[] {
  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "g");
  return [...rowHtml.matchAll(pattern)].map((m) => toText(m[1]));
}

export function parseStandings(html: string): StandingRow[] {
  const table = TABLE_PATTERN.exec(html)?.[1];
  if (!table) return [];

  const [headerHtml, ...bodyHtml] = table.split(/<\/tr>/);
  const fields = readCells(headerHtml, "th").map((h) => HEADER_FIELD[h]);
  if (!fields.includes("team")) return [];

  const rows: StandingRow[] = [];
  for (const rowHtml of bodyHtml) {
    const cells = readCells(rowHtml, "td");
    if (cells.length !== fields.length) continue;

    const row: StandingRow = {
      rank: "",
      team: "",
      games: "",
      wins: "",
      draws: "",
      losses: "",
      goals: "",
      goalDiff: "",
      points: "",
    };
    fields.forEach((field, i) => {
      if (field) row[field] = cells[i];
    });
    if (row.team) rows.push(row);
  }
  return rows;
}

export function isAllowedStandingsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === ALLOWED_HOST;
  } catch {
    return false;
  }
}

/** Returns an empty list on any failure so the page keeps rendering. */
export async function fetchStandings(url: string): Promise<StandingRow[]> {
  if (!isAllowedStandingsUrl(url)) return [];
  try {
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": "TGL-Handball-Website/1.0 (+https://tglhandball.de)" },
    });
    if (!res.ok) return [];
    return parseStandings(await res.text());
  } catch {
    return [];
  }
}
