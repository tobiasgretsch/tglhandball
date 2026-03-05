"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays } from "lucide-react";
import { urlFor } from "@/lib/sanity";
import type { NewsArticle, NewsCategory } from "@/types";

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

export const CATEGORY_STYLES: Record<
  NewsCategory,
  { bg: string; text: string; label: string }
> = {
  herren: { bg: "bg-accent/10",   text: "text-accent",      label: "Herren" },
  damen:  { bg: "bg-rose-100",     text: "text-rose-600",    label: "Damen"  },
  jugend: { bg: "bg-emerald-100",  text: "text-emerald-700", label: "Jugend" },
  verein: { bg: "bg-gray-100 dark:bg-gray-700",     text: "text-gray-600 dark:text-gray-300",    label: "Verein" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatPublishedDate(dateStr: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

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

// ─── Shared NewsCard (exported for use in detail page) ────────────────────────

export function NewsCard({ article }: { article: NewsArticle }) {
  const imageUrl = article.mainImage
    ? urlFor(article.mainImage).width(640).height(360).url()
    : null;

  const dateStr = article.publishedAt
    ? formatPublishedDate(article.publishedAt)
    : null;

  const category = article.category
    ? CATEGORY_STYLES[article.category]
    : null;

  return (
    <article className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col">
      {/* Thumbnail */}
      <Link href={`/news/${article.slug.current}`} tabIndex={-1} aria-hidden>
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-gray-100 dark:from-gray-700 to-gray-200 dark:to-gray-600">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={article.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/15 flex items-center justify-center">
              <span className="text-4xl font-black text-accent/15 select-none">
                NEWS
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-3">
          {category && (
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${category.bg} ${category.text}`}
            >
              {category.label}
            </span>
          )}
          {dateStr && (
            <span className="flex items-center gap-1 text-[11px] text-muted dark:text-gray-400 ml-auto">
              <CalendarDays size={11} className="shrink-0" />
              {dateStr}
            </span>
          )}
        </div>

        <Link href={`/news/${article.slug.current}`}>
          <h2 className="font-black text-text dark:text-gray-100 text-base leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h2>
        </Link>

        {article.teaser && (
          <p className="text-muted dark:text-gray-400 text-sm leading-relaxed line-clamp-2 flex-1">
            {article.teaser}
          </p>
        )}

        <Link
          href={`/news/${article.slug.current}`}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-wider mt-4 group-hover:gap-2.5 transition-all"
        >
          Weiterlesen <ArrowRight size={11} />
        </Link>
      </div>
    </article>
  );
}
