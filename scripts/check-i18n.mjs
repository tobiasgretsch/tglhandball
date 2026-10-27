// Fails when a locale file is missing keys, has extra keys, or has differing ICU placeholders
// compared with messages/de/*.json (the source of truth).
import { readFileSync, readdirSync } from "node:fs";

const DIR = new URL("../messages/", import.meta.url);
const SOURCE = "de";

const flatten = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? flatten(value, `${prefix}${key}.`)
      : [[`${prefix}${key}`, String(value)]],
  );
const load = (locale) =>
  new Map(
    readdirSync(new URL(`${locale}/`, DIR)).flatMap((file) =>
      flatten(JSON.parse(readFileSync(new URL(`${locale}/${file}`, DIR), "utf8"))),
    ),
  );
const placeholders = (text) => [...text.matchAll(/\{(\w+)/g)].map((m) => m[1]).sort().join(",");

const source = load(SOURCE);
const locales = readdirSync(DIR).filter((l) => l !== SOURCE);
const problems = [];

for (const locale of locales) {
  const target = load(locale);
  for (const [key, text] of source) {
    if (!target.has(key)) problems.push(`${locale}: missing "${key}"`);
    else if (placeholders(text) !== placeholders(target.get(key))) problems.push(`${locale}: placeholder mismatch in "${key}"`);
  }
  for (const key of target.keys()) if (!source.has(key)) problems.push(`${locale}: extra key "${key}"`);
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`i18n ok: ${source.size} keys in ${locales.length + 1} locales`);
