/** Minimal text extraction for the nuLiga HTML pages (club fixtures, league tables). */

const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

const ENTITY_PATTERN = /&(?:nbsp|amp|lt|gt|quot|#39);/g;

export function decodeEntities(value: string): string {
  return value.replace(ENTITY_PATTERN, (m) => HTML_ENTITIES[m]);
}

/** Strips tags, decodes entities and collapses whitespace. */
export function toText(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}
