"use client";

import { useState, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import type { NewsArticle, NewsCategory } from "@/types";
import Reveal from "@/components/ui/Reveal";
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
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl backdrop-saturate-150 border-b border-gray-100/80 dark:border-white/10 sticky top-[54px] lg:top-[60px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleFilterChange(value)}
                className={`press shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors border ${
                  activeCategory === value
                    ? "bg-primary border-primary text-white shadow-[0_8px_24px_-8px_rgb(218_37_28/0.55)]"
                    : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-muted dark:text-gray-400 hover:border-primary hover:text-primary dark:hover:text-primary-glow"
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
              {visible.map((article, i) => (
                <Reveal key={article._id} className="h-full" delay={Math.min(i % 3, 2) * 0.06}>
                  <NewsCard article={article} />
                </Reveal>
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  className="btn btn-primary"
                >
                  Mehr laden
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            )}

            <p className="text-center text-muted dark:text-gray-400 text-xs mt-5">
              {Math.min(visibleCount, filtered.length)} von {filtered.length} Artikeln
            </p>
          </>
        )}
      </div>
    </div>
  );
}

