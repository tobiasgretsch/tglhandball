import type { AbstractIntlMessages } from "next-intl";
import type { Locale } from "./routing";

// One JSON file per area (messages/<locale>/<area>.json); each file holds its own
// top-level namespaces. Add a new area here and in the two locale folders.
const AREAS = [
  "core",
  "layout",
  "home",
  "news",
  "teams",
  "spielplan",
  "live",
  "about",
  "foerderverein",
  "partner",
  "fanshop",
  "gallery",
  "magazine",
  "legal",
] as const;

export async function loadMessages(locale: Locale) {
  const files = await Promise.all(AREAS.map((area) => import(`../messages/${locale}/${area}.json`)));
  return Object.assign({}, ...files.map((file) => file.default)) as AbstractIntlMessages;
}
