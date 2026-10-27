import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DEFAULT_LOCALE, LOCALE_TAGS, type Locale } from "@/i18n/routing";
import { dateFormatter } from "@/lib/i18n/format";
import { urlFor } from "@/lib/sanity";
import type { NewsArticle, NewsCategory } from "@/types";

// ─── Shared constants & helpers ───────────────────────────────────────────────
// Kept in a plain module (no 'use client') so Server Components can import them.

const CATEGORY_STYLES: Record<
  NewsCategory,
  { bg: string; text: string }
> = {
  herren: { bg: "bg-accent",      text: "text-white"       },
  damen:  { bg: "bg-primary",     text: "text-white"       },
  jugend: { bg: "bg-accent-tint", text: "text-accent-deep" },
  verein: { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-700 dark:text-gray-200" },
};

export function formatPublishedDate(dateStr: string, locale: Locale = DEFAULT_LOCALE): string {
  return dateFormatter(LOCALE_TAGS[locale], {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function NewsCategoryChip({ category }: { category?: NewsCategory }) {
  const t = useTranslations("newsCategories");
  if (!category) return null;
  const style = CATEGORY_STYLES[category];
  return (
    <span
      className={`text-xs font-bold uppercase tracking-[0.12em] px-2.5 py-0.5 rounded-full ${style.bg} ${style.text}`}
    >
      {t(category)}
    </span>
  );
}

// ─── NewsCard component ───────────────────────────────────────────────────────

export function NewsCard({ article }: { article: NewsArticle }) {
  const t = useTranslations("newsCard");
  const locale = useLocale() as Locale;
  const imageUrl = article.mainImage
    ? urlFor(article.mainImage).width(640).height(360).url()
    : null;

  const dateStr = article.publishedAt
    ? formatPublishedDate(article.publishedAt, locale)
    : null;

  return (
    <article className="group press-card h-full bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-[0_1px_2px_rgb(0_0_0/0.06),0_12px_32px_-16px_rgb(0_0_0/0.2)] hover:shadow-[0_1px_2px_rgb(0_0_0/0.06),0_20px_44px_-16px_rgb(0_0_0/0.3)] transition-shadow duration-300 border border-gray-100 dark:border-gray-700 flex flex-col">
      {/* Thumbnail */}
      <Link href={`/news/${article.slug.current}`} tabIndex={-1} aria-hidden>
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-gray-100 dark:from-gray-700 to-gray-200 dark:to-gray-600">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={article.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover motion-safe:group-hover:scale-[1.03] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              placeholder={article.mainImage?.lqip ? "blur" : "empty"}
              blurDataURL={article.mainImage?.lqip ?? undefined}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/15 flex items-center justify-center">
              <span className="font-display font-bold italic text-4xl text-accent/15 select-none tracking-[-0.02em]">
                {t("placeholder")}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-3">
          <NewsCategoryChip category={article.category} />
          {dateStr && (
            <span className="flex items-center gap-1 text-xs text-muted ml-auto">
              <CalendarDays size={12} className="shrink-0" aria-hidden="true" />
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
          <p className="text-muted text-sm leading-relaxed line-clamp-2 flex-1">
            {article.teaser}
          </p>
        )}

        <Link
          href={`/news/${article.slug.current}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary dark:text-primary-glow uppercase tracking-wider mt-4 group-hover:gap-2.5 transition-[gap]"
        >
          {t("readMore")} <ArrowRight size={12} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
