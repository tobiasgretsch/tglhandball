import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { groq } from "next-sanity";
import { CalendarDays, User, ArrowLeft } from "lucide-react";
import { client, urlFor } from "@/lib/sanity";
import { newsDetailQuery, relatedNewsQuery } from "@/lib/queries";
import type { NewsArticle } from "@/types";
import PortableText from "@/components/ui/PortableText";
import { NewsCard, CATEGORY_STYLES, formatPublishedDate } from "@/components/sections/NewsCard";

// ─── Static params + metadata ─────────────────────────────────────────────────

export async function generateStaticParams() {
  const articles = await client
    .fetch<Array<{ slug: { current: string } }>>(
      groq`*[_type == "news"] { slug }`,
      {},
      { next: { revalidate: 1800 } }
    )
    .catch(() => []);

  return articles.map((a) => ({ slug: a.slug.current }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await client
    .fetch<NewsArticle>(newsDetailQuery, { slug })
    .catch(() => null);

  if (!article) return { title: "News | TGL MIPA Landshut Handball" };

  const ogImage = article.mainImage
    ? urlFor(article.mainImage).width(1200).height(630).url()
    : undefined;

  return {
    title: `${article.title} | TGL MIPA Landshut Handball`,
    description: article.teaser,
    openGraph: {
      title: article.title,
      description: article.teaser,
      type: "article",
      publishedTime: article.publishedAt,
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630 }] }),
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const revalidate = 1800;

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;

  const [article, related] = await Promise.all([
    client
      .fetch<NewsArticle>(newsDetailQuery, { slug }, { next: { revalidate: 1800 } })
      .catch(() => null),
    client
      .fetch<NewsArticle[]>(
        relatedNewsQuery,
        { currentSlug: slug },
        { next: { revalidate: 1800 } }
      )
      .catch(() => [] as NewsArticle[]),
  ]);

  if (!article) notFound();

  const heroUrl = article.mainImage
    ? urlFor(article.mainImage).width(1600).height(700).url()
    : null;

  const category = article.category ? CATEGORY_STYLES[article.category] : null;
  const dateStr = article.publishedAt
    ? formatPublishedDate(article.publishedAt)
    : null;

  return (
    <>
      {/* ── Hero image ─────────────────────────────────────────────── */}
      <div className="relative w-full h-[300px] md:h-[440px] lg:h-[520px] bg-gradient-to-br from-accent to-[#001f4d] overflow-hidden">
        {heroUrl && (
          <Image
            src={heroUrl}
            alt={article.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
        {/* Bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-900 via-transparent to-transparent" />
      </div>

      {/* ── Article content ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {/* Back link */}
          <div className="pt-8 mb-8">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-muted dark:text-gray-400 hover:text-primary transition-colors"
            >
              <ArrowLeft size={14} />
              Alle Neuigkeiten
            </Link>
          </div>

          {/* Category + date */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {category && (
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded ${category.bg} ${category.text}`}
              >
                {category.label}
              </span>
            )}
            {dateStr && (
              <span className="flex items-center gap-1.5 text-[12px] text-muted dark:text-gray-400">
                <CalendarDays size={13} className="shrink-0" />
                {dateStr}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-text dark:text-gray-100 leading-tight tracking-tight mb-6">
            {article.title}
          </h1>

          {/* Author */}
          {article.author && (
            <div className="flex items-center gap-2 mb-8 pb-8 border-b border-gray-100 dark:border-gray-700">
              <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                <User size={14} className="text-accent" />
              </div>
              <span className="text-[13px] text-muted dark:text-gray-400">
                Von <strong className="text-text dark:text-gray-100">{article.author}</strong>
              </span>
            </div>
          )}

          {/* Teaser (if no body, show as lead paragraph) */}
          {article.teaser && (!article.body || article.body.length === 0) && (
            <p className="text-lg text-text/70 dark:text-gray-300 leading-relaxed mb-6">
              {article.teaser}
            </p>
          )}

          {/* Body text */}
          {article.body && article.body.length > 0 && (
            <PortableText value={article.body} />
          )}
        </div>
      </div>

      {/* ── Related news ───────────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="bg-background dark:bg-gray-900 py-14 md:py-20 border-t border-gray-100 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section heading */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <span className="block w-8 h-[3px] bg-primary rounded-full" />
                <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted dark:text-gray-400">
                  Weitere Neuigkeiten
                </h2>
              </div>
              <Link
                href="/news"
                className="hidden sm:inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-primary hover:text-primary-light transition-colors"
              >
                Alle News <ArrowLeft size={13} className="rotate-180" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((a) => (
                <NewsCard key={a._id} article={a} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
