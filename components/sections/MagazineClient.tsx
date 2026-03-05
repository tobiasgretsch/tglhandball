"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Download, FileX } from "lucide-react";
import type { Magazine } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}.${month}.${year}`;
}

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
    const key = mag.season ?? "Unbekannte Saison";
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
  const seasons = useMemo(() => groupBySeason(magazines), [magazines]);
  const [openSeason, setOpenSeason] = useState<string | null>(
    seasons[0]?.season ?? null
  );

  if (seasons.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-muted dark:text-gray-400 text-sm">
          Noch keine Spieltagsmagazine verfügbar.
        </p>
      </div>
    );
  }

  return (
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
        />
      ))}
    </div>
  );
}

// ─── Season accordion ─────────────────────────────────────────────────────────

function SeasonAccordion({
  group,
  isOpen,
  onToggle,
}: {
  group: SeasonGroup;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const availableCount = group.entries.filter(
    (m) => getPdfUrl(m) !== null
  ).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 dark:hover:bg-gray-700/60 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4">
          <span
            className={`block w-1 h-8 rounded-full shrink-0 transition-colors ${
              isOpen ? "bg-primary" : "bg-gray-200 dark:bg-gray-600"
            }`}
          />
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted dark:text-gray-400 mb-0.5">
              Saison
            </p>
            <p className="text-lg font-black text-text dark:text-gray-100 leading-tight">
              {group.season}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <span className="hidden sm:block text-[11px] text-muted dark:text-gray-400 tabular-nums">
            {availableCount}/{group.entries.length} verfügbar
          </span>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="text-muted dark:text-gray-400"
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
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="border-t border-gray-100 dark:border-gray-700">
              <MagazineTable entries={group.entries} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Magazine table ───────────────────────────────────────────────────────────

function MagazineTable({ entries }: { entries: Magazine[] }) {
  return (
    <>
      <table className="hidden sm:table w-full text-sm border-collapse">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-widest text-muted dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
            <th className="text-left px-5 py-3 w-[160px]">Spieltag</th>
            <th className="text-left px-3 py-3">Gegner</th>
            <th className="text-left px-3 py-3 w-[130px]">Datum</th>
            <th className="text-right px-5 py-3 w-[180px]">Download</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((mag, i) => (
            <MagazineTableRow key={mag._id} magazine={mag} striped={i % 2 === 1} />
          ))}
        </tbody>
      </table>

      <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
        {entries.map((mag) => (
          <MagazineMobileRow key={mag._id} magazine={mag} />
        ))}
      </div>
    </>
  );
}

// ─── Desktop row ──────────────────────────────────────────────────────────────

function MagazineTableRow({
  magazine,
  striped,
}: {
  magazine: Magazine;
  striped: boolean;
}) {
  const pdfUrl = getPdfUrl(magazine);

  return (
    <tr
      className={`border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors ${
        striped
          ? "bg-gray-50/40 dark:bg-gray-700/20"
          : "bg-white dark:bg-gray-800"
      }`}
    >
      <td className="px-5 py-3.5 font-bold text-[13px] text-text dark:text-gray-100">
        {magazine.matchday != null ? `${magazine.matchday}. Heimspieltag` : "–"}
      </td>
      <td className="px-3 py-3.5 text-[13px] text-text dark:text-gray-100">
        {magazine.opponent ?? "–"}
      </td>
      <td className="px-3 py-3.5 text-[13px] text-muted dark:text-gray-400 tabular-nums">
        {magazine.date ? formatDate(magazine.date) : "–"}
      </td>
      <td className="px-5 py-3.5 text-right">
        {pdfUrl ? (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-[11px] font-bold uppercase tracking-wide hover:bg-accent/85 transition-colors"
          >
            <Download size={11} />
            Herunterladen
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted/60 dark:text-gray-500 cursor-default select-none">
            <FileX size={11} />
            Demnächst verfügbar
          </span>
        )}
      </td>
    </tr>
  );
}

// ─── Mobile row ───────────────────────────────────────────────────────────────

function MagazineMobileRow({ magazine }: { magazine: Magazine }) {
  const pdfUrl = getPdfUrl(magazine);

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="min-w-0">
        <p className="font-bold text-[13px] text-text dark:text-gray-100 truncate">
          {magazine.opponent ?? "Spieltagsheft"}
        </p>
        <p className="text-[11px] text-muted dark:text-gray-400 mt-0.5">
          {magazine.matchday != null ? `${magazine.matchday}. Heimspieltag` : ""}
          {magazine.matchday != null && magazine.date ? " · " : ""}
          {magazine.date ? formatDate(magazine.date) : ""}
        </p>
      </div>

      {pdfUrl ? (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-[11px] font-bold uppercase tracking-wide hover:bg-accent/85 transition-colors"
        >
          <Download size={11} />
          PDF
        </a>
      ) : (
        <span className="shrink-0 text-[11px] text-muted/60 dark:text-gray-500 font-medium">
          Demnächst
        </span>
      )}
    </div>
  );
}
