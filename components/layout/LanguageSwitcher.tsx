"use client";

import type { MouseEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getPathname, usePathname } from "@/i18n/navigation";
import { LOCALES, LOCALE_LABELS, LOCALE_TAGS, type Locale } from "@/i18n/routing";

type Variant = "header" | "drawer";

const BASE_CLASS =
  "min-w-9 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] transition-colors";

const TONE_CLASS: Record<Variant, { group: string; active: string; idle: string }> = {
  header: {
    group: "ml-2 flex items-center gap-0.5 rounded-full border border-white/25 p-0.5",
    active: "bg-white text-primary dark:text-gray-900",
    idle: "text-white/75 hover:text-white hover:bg-white/10",
  },
  drawer: {
    group: "flex items-center gap-1 rounded-full border border-gray-200 p-1 dark:border-white/25",
    active: "bg-primary text-white dark:bg-white dark:text-primary",
    idle: "text-gray-700 hover:bg-red-50 hover:text-gray-900 dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white",
  },
};

/** Links the current page in every language, keeping path, query string and hash. */
export default function LanguageSwitcher({ variant = "header" }: { variant?: Variant }) {
  const t = useTranslations("switcher");
  const current = useLocale() as Locale;
  const pathname = usePathname();
  const tone = TONE_CLASS[variant];

  // Plain anchors on purpose: the locale layout owns <html>, and a soft swap would drop the theme class set before hydration.
  const carryQueryAndHash = (event: MouseEvent<HTMLAnchorElement>) => {
    const { search, hash } = window.location;
    event.currentTarget.href = `${event.currentTarget.pathname}${search}${hash}`;
  };

  return (
    <div role="group" aria-label={t("label")} className={tone.group}>
      {LOCALES.map((locale) => (
        <a
          key={locale}
          href={getPathname({ href: pathname, locale })}
          lang={locale}
          hrefLang={LOCALE_TAGS[locale]}
          aria-label={LOCALE_LABELS[locale]}
          aria-current={locale === current ? "true" : undefined}
          onClick={locale === current ? (event) => event.preventDefault() : carryQueryAndHash}
          className={`${BASE_CLASS} ${variant === "drawer" ? "flex-1 py-2 text-center" : "text-center"} ${
            locale === current ? tone.active : tone.idle
          }`}
        >
          {variant === "drawer" ? LOCALE_LABELS[locale] : locale}
        </a>
      ))}
    </div>
  );
}
