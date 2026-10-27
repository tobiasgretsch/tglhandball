"use client";

import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { getPathname, usePathname } from "@/i18n/navigation";
import { LOCALES, LOCALE_LABELS, LOCALE_TAGS, type Locale } from "@/i18n/routing";

type Variant = "header" | "drawer";

const DRAWER_ITEM_BASE = "flex-1 min-w-9 rounded-full px-2.5 py-2 text-center text-xs font-bold tracking-[0.12em] transition-colors";
const DRAWER_GROUP = "flex items-center gap-1 rounded-full border border-gray-200 p-1 dark:border-white/25";
const DRAWER_ACTIVE = "bg-primary text-white dark:bg-white dark:text-primary";
const DRAWER_IDLE =
  "text-gray-700 hover:bg-red-50 hover:text-gray-900 dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white";

/** Links to the current page in every language, keeping path, query string and hash. */
export default function LanguageSwitcher({ variant = "header" }: { variant?: Variant }) {
  const t = useTranslations("switcher");
  const current = useLocale() as Locale;
  const pathname = usePathname();

  // Plain anchors on purpose: the locale layout owns <html>, and a soft swap would drop the theme class set before hydration.
  const carryQueryAndHash = (event: MouseEvent<HTMLAnchorElement>) => {
    const { search, hash } = window.location;
    event.currentTarget.href = `${event.currentTarget.pathname}${search}${hash}`;
  };

  const linkProps = (locale: Locale) => ({
    href: getPathname({ href: pathname, locale }),
    lang: locale,
    hrefLang: LOCALE_TAGS[locale],
    "aria-current": locale === current ? ("true" as const) : undefined,
    onClick: locale === current ? (event: MouseEvent) => event.preventDefault() : carryQueryAndHash,
  });

  if (variant === "drawer") {
    return (
      <div role="group" aria-label={t("label")} className={DRAWER_GROUP}>
        {LOCALES.map((locale) => (
          <a
            key={locale}
            {...linkProps(locale)}
            className={`${DRAWER_ITEM_BASE} ${locale === current ? DRAWER_ACTIVE : DRAWER_IDLE}`}
          >
            {LOCALE_LABELS[locale]}
          </a>
        ))}
      </div>
    );
  }

  return <LanguageDropdown current={current} label={t("label")} currentLabel={t("current", { language: LOCALE_LABELS[current] })} linkProps={linkProps} />;
}

interface LanguageDropdownProps {
  current: Locale;
  label: string;
  currentLabel: string;
  linkProps: (locale: Locale) => Record<string, unknown>;
}

function LanguageDropdown({ current, label, currentLabel, linkProps }: LanguageDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative ml-2">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={currentLabel}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-[13px] font-bold uppercase tracking-[0.12em] text-white/75 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Globe size={16} aria-hidden />
        {current}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.2 }}
          className="inline-flex"
        >
          <ChevronDown size={13} aria-hidden />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            aria-label={label}
            initial={{ opacity: 0, y: prefersReduced ? 0 : 6, scale: prefersReduced ? 1 : 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: prefersReduced ? 0 : 6, scale: prefersReduced ? 1 : 0.97 }}
            transition={{ duration: prefersReduced ? 0 : 0.16, ease: "easeOut" }}
            className="absolute right-0 top-full z-10 mt-1 max-h-[70dvh] min-w-44 overflow-y-auto rounded-lg bg-white shadow-2xl ring-1 ring-black/5 dark:bg-gray-900/95 dark:ring-white/15 dark:backdrop-blur-xl dark:saturate-150"
          >
            {LOCALES.map((locale) => (
              <li key={locale} className="border-b border-gray-100 last:border-0 dark:border-white/10">
                <a
                  {...linkProps(locale)}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-semibold transition-colors ${
                    locale === current
                      ? "text-primary dark:text-white"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
                  }`}
                >
                  {LOCALE_LABELS[locale]}
                  {locale === current && <Check size={15} aria-hidden />}
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
