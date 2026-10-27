import { defineRouting } from "next-intl/routing";

export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "de";

/** Native names, shown in the language switcher. */
export const LOCALE_LABELS: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
};

/** BCP 47 tags for `Intl`, `inLanguage` and `hreflang`. */
export const LOCALE_TAGS: Record<Locale, string> = {
  de: "de-DE",
  en: "en-GB",
};

/** Open Graph uses underscores (`de_DE`). */
export const OG_LOCALES: Record<Locale, string> = {
  de: "de_DE",
  en: "en_GB",
};

// German keeps its URLs (`/spielplan`); other languages are prefixed (`/en/spielplan`).
// Detection is off: the URL alone decides the language (no cookie/Accept-Language redirects), which keeps pages cacheable.
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "as-needed",
  localeDetection: false,
});
