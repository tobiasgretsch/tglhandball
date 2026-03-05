"use client";

import { useState, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import type { NewsArticle, NewsCategory } from "@/types";
import { NewsCard } from "@/components/sections/NewsCard";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 9;

type FilterCategory = NewsCategory | "all";

const FILTERS: { value: FilterCategory; label: string }[] = [
  { value: "all",    label: "Alle"   },
  { value: "herren", label: "Herren" },
  { value: "damen",  label: "Damen"  },
  { value: "jugend", label: "Jugend" },
  { value: "verein", label: "Verein" },
];

// ─── Main component ───────────────────────────────────────────────────────────

interface NewsClientProps {
  articles: NewsArticle[];
}

export default function NewsClient({ articles }: NewsClientProps) {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(
    () =>
      activeCategory === "all"
        ? articles
        : articles.filter((a) => a.category === activeCategory),
    [articles, activeCategory]
  );

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  function handleFilterChange(cat: FilterCategory) {
    setActiveCategory(cat);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className="bg-background dark:bg-gray-900 min-h-[60vh]">
      {/* ── Filter bar ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-[68px] lg:top-[76px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleFilterChange(value)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wide transition-colors border ${
                  activeCategory === value
                    ? "bg-primary border-primary text-white shadow-sm shadow-primary/20"
                    : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-muted dark:text-gray-400 hover:border-primary hover:text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {filtered.length === 0 ? (
          <p className="text-muted dark:text-gray-400 text-sm py-10">
            Keine Artikel in dieser Kategorie gefunden.
          </p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visible.map((article) => (
                <NewsCard key={article._id} article={article} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  className="inline-flex items-center gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold uppercase tracking-widest text-[12px] px-8 py-3 rounded-sm transition-colors"
                >
                  Mehr laden
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            <p className="text-center text-muted dark:text-gray-400 text-[11px] mt-5">
              {Math.min(visibleCount, filtered.length)} von {filtered.length} Artikeln
            </p>
          </>
        )}
      </div>
    </div>
  );
}

