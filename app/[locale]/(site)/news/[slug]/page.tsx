import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { groq } from "next-sanity";
import { CalendarDays, User, ArrowLeft, ArrowRight } from "lucide-react";
import { Link, getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { client, urlFor } from "@/lib/sanity";
import { newsDetailQuery, relatedNewsQuery } from "@/lib/queries";
import type { NewsArticle } from "@/types";
import Reveal from "@/components/ui/Reveal";
import PortableText from "@/components/ui/PortableText";
import JsonLd from "@/components/ui/JsonLd";
import { breadcrumbJsonLd, localizedAlternates, newsArticleJsonLd } from "@/lib/seo";
import { NewsCard, NewsCategoryChip, formatPublishedDate } from "@/components/sections/NewsCard";

// ─── Static params + metadata ─────────────────────────────────────────────────

export async function generateStaticParams() {
  const articles = await client
    .fetch<Array<{ slug: { current: string } }>>(
      groq`*[_type == "news"] { slug }`,
      {},
      { next: { revalidate: 1800 } }
    )
    .catch(() => []);

  return articles
    .filter((a) => a.slug?.current)
    .map((a) => ({ slug: a.slug.current }));
}

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "newsDetail" });
  const article = await client
    .fetch<NewsArticle>(newsDetailQuery, { slug })
    .catch(() => null);

  if (!article) return { title: t("fallbackTitle") };

  const ogImage = article.mainImage
    ? urlFor(article.mainImage).width(1200).height(630).url()
    : undefined;

  return {
    title: article.title,
    description: article.teaser,
    alternates: localizedAlternates(`/news/${slug}`, locale),
    openGraph: {
      title: article.title,
      description: article.teaser,
      type: "article",
      publishedTime: article.publishedAt,
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630, alt: article.title }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.teaser ?? undefined,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const revalidate = 1800;

export default async function NewsDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("newsDetail");

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

  const dateStr = article.publishedAt
    ? formatPublishedDate(article.publishedAt, locale)
    : null;

  const structuredData = [
    newsArticleJsonLd({
      title: article.title,
      path: getPathname({ locale, href: `/news/${slug}` }),
      teaser: article.teaser,
      publishedAt: article.publishedAt,
      author: article.author,
      imageUrl: article.mainImage ? urlFor(article.mainImage).width(1200).height(630).url() : undefined,
    }, locale),
    breadcrumbJsonLd([
      { name: t("breadcrumbHome"), path: getPathname({ locale, href: "/" }) },
      { name: t("breadcrumbNews"), path: getPathname({ locale, href: "/news" }) },
      { name: article.title, path: getPathname({ locale, href: `/news/${slug}` }) },
    ]),
  ];

  return (
    <>
      <JsonLd data={structuredData} />
      {/* ── Hero image ─────────────────────────────────────────────── */}
      <div className="relative w-full h-[300px] md:h-[440px] lg:h-[520px] bg-gradient-to-br from-accent to-accent-dark overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-t from-accent-dark/40 to-transparent" />
        {/* Rounded sheet edge — article slides over the image */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-8 md:h-12 sheet-top bg-white dark:bg-gray-900"
        />
      </div>

      {/* ── Article content ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {/* Back link */}
          <div className="pt-8 mb-8">
            <Link
              href="/news"
              className="press inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted hover:text-primary dark:hover:text-primary-glow transition-colors"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              {t("backToAll")}
            </Link>
          </div>

          <Reveal>
          {/* Category + date */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <NewsCategoryChip category={article.category} />
            {dateStr && (
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <CalendarDays size={13} className="shrink-0" aria-hidden="true" />
                {dateStr}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="font-display font-bold italic uppercase text-4xl md:text-5xl lg:text-6xl text-text dark:text-gray-100 leading-[0.95] tracking-[-0.02em] text-balance mb-6">
            {article.title}
          </h1>

          {/* Author */}
          {article.author && (
            <div className="flex items-center gap-2 mb-8 pb-8 border-b border-gray-100 dark:border-gray-700">
              <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                <User size={14} className="text-accent dark:text-accent-sky" aria-hidden="true" />
              </div>
              <span className="text-sm text-muted">
                {t.rich("by", {
                  author: article.author,
                  b: (chunks) => <strong className="text-text dark:text-gray-100">{chunks}</strong>,
                })}
              </span>
            </div>
          )}
          </Reveal>

          {/* Teaser (if no body, show as lead paragraph) */}
          {article.teaser && (!article.body || article.body.length === 0) && (
            <p className="text-lg md:text-xl text-text/75 dark:text-gray-300 leading-[1.6] mb-6 max-w-[65ch]">
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
        <section className="bg-background dark:bg-gray-900 py-14 md:py-20 ">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section heading */}
            <Reveal className="flex items-end justify-between mb-10">
              <h2 className="font-display font-bold italic uppercase text-4xl md:text-5xl tracking-[-0.02em] text-text dark:text-gray-100">
                {t("relatedHeading")}
              </h2>
              <Link
                href="/news"
                className="press hidden sm:inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-primary dark:text-primary-glow hover:text-primary-light transition-colors shrink-0 mb-1"
              >
                {t("allNews")} <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </Reveal>

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
