"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown, BookOpen, FileX } from "lucide-react";
import type { Magazine } from "@/types";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { LOCALE_TAGS, type Locale } from "@/i18n/routing";
import { dateFormatter } from "@/lib/i18n/format";

// pdfjs-dist uses browser-only APIs (DOMMatrix) — never run on the server
const PdfViewer = dynamic(() => import("@/components/sections/PdfViewer"), { ssr: false });

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formats a "YYYY-MM-DD" date in the active locale. */
function useFormatDate(): (dateStr: string) => string {
  const tag = LOCALE_TAGS[useLocale() as Locale];
  return (dateStr) =>
    dateFormatter(tag, { day: "2-digit", month: "2-digit", year: "numeric" }).format(
      new Date(`${dateStr}T12:00:00Z`),
    );
}

/** Group key for magazines without a season; shown as a translated label. */
const UNKNOWN_SEASON = "";

function getPdfUrl(magazine: Magazine): string | null {
  return magazine.pdfFile?.asset?.url ?? null;
}

// ─── Season grouping ──────────────────────────────────────────────────────────

interface SeasonGroup {
  season: string;
  entries: Magazine[];
}

function groupBySeason(magazines: Magazine[]): SeasonGroup[] {
  const map = new Map<string, Magazine[]>();

  for (const mag of magazines) {
    const key = mag.season ?? UNKNOWN_SEASON;
    const existing = map.get(key);
    if (existing) {
      existing.push(mag);
    } else {
      map.set(key, [mag]);
    }
  }

  for (const entries of map.values()) {
    entries.sort((a, b) => {
      if (a.matchday !== undefined && b.matchday !== undefined) {
        return a.matchday - b.matchday;
      }
      if (a.date && b.date) return a.date.localeCompare(b.date);
      return 0;
    });
  }

  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([season, entries]) => ({ season, entries }));
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MagazineClient({ magazines }: { magazines: Magazine[] }) {
  const t = useTranslations("magazine");
  const seasons = useMemo(() => groupBySeason(magazines), [magazines]);
  const [openSeason, setOpenSeason] = useState<string | null>(
    seasons[0]?.season ?? null
  );
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  if (seasons.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-muted text-sm">
          {t("empty")}
        </p>
      </div>
    );
  }

  return (
    <>
      {viewerUrl && (
        <PdfViewer url={viewerUrl} onClose={() => setViewerUrl(null)} />
      )}
      <div className="bg-background dark:bg-gray-900 min-h-[60vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-3">
          {seasons.map((group) => (
            <SeasonAccordion
              key={group.season}
              group={group}
              isOpen={openSeason === group.season}
              onToggle={() =>
                setOpenSeason((prev) =>
                  prev === group.season ? null : group.season
                )
              }
              onOpenPdf={setViewerUrl}
            />
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Season accordion ─────────────────────────────────────────────────────────

function SeasonAccordion({
  group,
  isOpen,
  onToggle,
  onOpenPdf,
}: {
  group: SeasonGroup;
  isOpen: boolean;
  onToggle: () => void;
  onOpenPdf: (url: string) => void;
}) {
  const t = useTranslations("magazine");
  const prefersReduced = useReducedMotion() ?? false;
  const availableCount = group.entries.filter(
    (m) => getPdfUrl(m) !== null
  ).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_12px_32px_-16px_rgb(0_0_0/0.2)] overflow-hidden">
      <button
        onClick={onToggle}
        className="press-card w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 dark:hover:bg-gray-700/60 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4">
          <span
            className={`block w-1 h-8 rounded-full shrink-0 transition-colors ${
              isOpen ? "bg-primary" : "bg-gray-200 dark:bg-gray-600"
            }`}
          />
          <div className="text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted mb-0.5">
              {t("season")}
            </p>
            <p className="font-display font-bold italic uppercase text-2xl tracking-[-0.02em] text-text dark:text-gray-100 leading-tight">
              {group.season || t("unknownSeason")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <span className="hidden sm:block text-xs text-muted tabular-nums">
            {t("available", { available: availableCount, total: group.entries.length })}
          </span>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={prefersReduced ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.4 }}
            className="text-muted"
          >
            <ChevronDown size={18} />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={prefersReduced ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.45 }}
            style={{ overflow: "hidden" }}
          >
            <div className="border-t border-gray-100 dark:border-gray-700">
              <MagazineTable entries={group.entries} onOpenPdf={onOpenPdf} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Magazine table ───────────────────────────────────────────────────────────

function MagazineTable({ entries, onOpenPdf }: { entries: Magazine[]; onOpenPdf: (url: string) => void }) {
  const t = useTranslations("magazine");
  return (
    <>
      <table className="hidden sm:table w-full text-sm border-collapse">
        <thead>
          <tr className="text-xs font-bold uppercase tracking-[0.12em] text-muted border-b border-gray-100 dark:border-gray-700">
            <th className="text-left px-5 py-3 w-[160px]">{t("columns.matchday")}</th>
            <th className="text-left px-3 py-3">{t("columns.opponent")}</th>
            <th className="text-left px-3 py-3 w-[130px]">{t("columns.date")}</th>
            <th className="text-right px-5 py-3 w-[160px]">{t("columns.read")}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((mag, i) => (
            <MagazineTableRow key={mag._id} magazine={mag} striped={i % 2 === 1} onOpenPdf={onOpenPdf} />
          ))}
        </tbody>
      </table>

      <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
        {entries.map((mag) => (
          <MagazineMobileRow key={mag._id} magazine={mag} onOpenPdf={onOpenPdf} />
        ))}
      </div>
    </>
  );
}

// ─── Desktop row ──────────────────────────────────────────────────────────────

function MagazineTableRow({
  magazine,
  striped,
  onOpenPdf,
}: {
  magazine: Magazine;
  striped: boolean;
  onOpenPdf: (url: string) => void;
}) {
  const t = useTranslations("magazine");
  const formatDate = useFormatDate();
  const pdfUrl = getPdfUrl(magazine);

  return (
    <tr
      className={`border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors ${
        striped
          ? "bg-gray-50/40 dark:bg-gray-700/20"
          : "bg-white dark:bg-gray-800"
      }`}
    >
      <td className="px-5 py-4 font-bold text-[13px] text-text dark:text-gray-100">
        {magazine.matchday != null ? t("homeMatchday", { number: magazine.matchday }) : "–"}
      </td>
      <td className="px-3 py-4 text-[13px] text-text dark:text-gray-100">
        {magazine.opponent ?? "–"}
      </td>
      <td className="px-3 py-4 text-[13px] text-muted tabular-nums">
        {magazine.date ? formatDate(magazine.date) : "–"}
      </td>
      <td className="px-5 py-4 text-right">
        {pdfUrl ? (
          <button
            onClick={() => onOpenPdf(pdfUrl)}
            className="press inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent text-white text-xs font-bold uppercase tracking-wide hover:bg-accent/85 transition-colors"
          >
            <BookOpen size={12} aria-hidden="true" />
            {t("read")}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted cursor-default select-none">
            <FileX size={12} aria-hidden="true" />
            {t("comingSoon")}
          </span>
        )}
      </td>
    </tr>
  );
}

// ─── Mobile row ───────────────────────────────────────────────────────────────

function MagazineMobileRow({ magazine, onOpenPdf }: { magazine: Magazine; onOpenPdf: (url: string) => void }) {
  const t = useTranslations("magazine");
  const formatDate = useFormatDate();
  const pdfUrl = getPdfUrl(magazine);

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-4">
      <div className="min-w-0">
        <p className="font-bold text-[13px] text-text dark:text-gray-100 truncate">
          {magazine.opponent ?? t("fallbackTitle")}
        </p>
        <p className="text-xs text-muted mt-0.5">
          {magazine.matchday != null ? t("homeMatchday", { number: magazine.matchday }) : ""}
          {magazine.matchday != null && magazine.date ? " · " : ""}
          {magazine.date ? formatDate(magazine.date) : ""}
        </p>
      </div>

      {pdfUrl ? (
        <button
          onClick={() => onOpenPdf(pdfUrl)}
          className="press shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent text-white text-xs font-bold uppercase tracking-wide hover:bg-accent/85 transition-colors"
        >
          <BookOpen size={14} aria-hidden="true" />
          {t("read")}
        </button>
      ) : (
        <span className="shrink-0 text-xs text-muted font-medium">
          {t("comingSoonShort")}
        </span>
      )}
    </div>
  );
}
