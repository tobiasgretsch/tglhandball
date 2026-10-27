"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import type { NewsArticle, NewsCategory } from "@/types";
import Reveal from "@/components/ui/Reveal";
import { NewsCard } from "@/components/sections/NewsCard";
import FilterPill from "@/components/ui/FilterPill";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 9;

type FilterCategory = NewsCategory | "all";

const FILTERS: readonly FilterCategory[] = ["all", "herren", "damen", "jugend", "verein"];

// ─── Main component ───────────────────────────────────────────────────────────

interface NewsClientProps {
  articles: NewsArticle[];
}

export default function NewsClient({ articles }: NewsClientProps) {
  const t = useTranslations("newsPage");
  const tCategories = useTranslations("newsCategories");
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
      <div className="material-bar sticky top-[54px] lg:top-[60px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {FILTERS.map((value) => (
              <FilterPill
                key={value}
                label={tCategories(value)}
                active={activeCategory === value}
                onClick={() => handleFilterChange(value)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {filtered.length === 0 ? (
          <p className="text-muted text-sm py-10">
            {t("empty")}
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
                  {t("loadMore")}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            )}

            <p className="text-center text-muted text-xs mt-5">
              {t("count", { shown: Math.min(visibleCount, filtered.length), total: filtered.length })}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

