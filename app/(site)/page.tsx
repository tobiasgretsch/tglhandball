import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, ExternalLink, MapPin, Trophy } from "lucide-react";
import { client, urlFor } from "@/lib/sanity";
import {
  settingsQuery,
  latestNewsQuery,
  homeUpcomingMatchesQuery,
  latestResultQuery,
  premiumPartnersQuery,
  partnerOfTheDayQuery,
} from "@/lib/queries";
import type { Settings, NewsArticle, Match, Partner } from "@/types";
import HeroSection from "@/components/sections/HeroSection";

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "TG MIPA Landshut – Leidenschaft seit Jahrzehnten",
  description:
    "Offizielle Website des TG MIPA Landshut. Aktuelle News, Spielplan, Mannschaften und mehr.",
  openGraph: {
    title: "TG MIPA Landshut",
    description: "Handball in Landshut – Leidenschaft seit Jahrzehnten.",
    type: "website",
  },
};

export const revalidate = 300;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const now = new Date().toISOString();

  const [settings, news, upcoming, latestResult, premiumPartners, partnerOfDay] =
    await Promise.all([
      client
        .fetch<Settings>(settingsQuery, {}, { next: { revalidate: 3600 } })
        .catch(() => null),
      client
        .fetch<NewsArticle[]>(latestNewsQuery, {}, { next: { revalidate: 300 } })
        .catch(() => [] as NewsArticle[]),
      client
        .fetch<Match[]>(
          homeUpcomingMatchesQuery,
          { now },
          { next: { revalidate: 3600 } }
        )
        .catch(() => [] as Match[]),
      client
        .fetch<Match | null>(
          latestResultQuery,
          {},
          { next: { revalidate: 3600 } }
        )
        .catch(() => null),
      client
        .fetch<Partner[]>(premiumPartnersQuery, {}, { next: { revalidate: 3600 } })
        .catch(() => [] as Partner[]),
      client
        .fetch<Partner | null>(partnerOfTheDayQuery, {}, { next: { revalidate: 3600 } })
        .catch(() => null),
    ]);

  const heroImageUrl = settings?.heroImage
    ? urlFor(settings.heroImage).width(1920).height(1080).url()
    : null;

  const matchCards: Array<Match & { isResult: boolean }> = [
    ...upcoming.map((m) => ({ ...m, isResult: false })),
    ...(latestResult ? [{ ...latestResult, isResult: true }] : []),
  ];

  return (
    <>
      {/* ── Section 1: Hero ─────────────────────────────────────────── */}
      <HeroSection
        heroImageUrl={heroImageUrl}
        clubName={settings?.clubName ?? "TG MIPA Landshut"}
      />

      {/* ── Section 2: Aktuell (matches) ────────────────────────────── */}
      {matchCards.length > 0 && (
        <section className="bg-white dark:bg-gray-800 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader label="Aktuell" title="Spiele & Ergebnisse" />
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchCards.map((match) => (
                <MatchCard key={match._id} match={match} isResult={match.isResult} />
              ))}
            </div>
            <div className="mt-8">
              <Link
                href="/spielplan"
                className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-primary hover:text-primary-light transition-colors"
              >
                Gesamter Spielplan <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Section 3: Neuigkeiten ───────────────────────────────────── */}
      <section className="bg-background dark:bg-gray-900 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <SectionHeader label="Neuigkeiten" title="Aktuelles vom Verein" />
            <Link
              href="/news"
              className="hidden sm:inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-primary hover:text-primary-light transition-colors shrink-0"
            >
              Alle News <ArrowRight size={14} />
            </Link>
          </div>

          {news.length === 0 ? (
            <p className="text-muted dark:text-gray-400 text-sm">
              Noch keine News vorhanden. Bitte Artikel im CMS anlegen.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((article) => (
                <NewsCard key={article._id} article={article} />
              ))}
            </div>
          )}

          <div className="mt-8 sm:hidden">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-primary hover:text-primary-light transition-colors"
            >
              Alle News <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section 4: Premium-Partner-Leiste ───────────────────────── */}
      {premiumPartners.length > 0 && (
        <section className="bg-white dark:bg-gray-800 py-10 border-t border-gray-100 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted dark:text-gray-400 mb-8 text-center">
              Unsere Partner
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14">
              {premiumPartners.map((partner) => {
                const logoUrl = partner.logo
                  ? urlFor(partner.logo).width(240).height(80).url()
                  : null;

                const inner = logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={partner.name}
                    width={160}
                    height={56}
                    className="object-contain max-h-[56px] w-auto opacity-80 hover:opacity-100 transition-opacity duration-200"
                  />
                ) : (
                  <span className="text-sm font-bold text-muted hover:text-text transition-colors">
                    {partner.name}
                  </span>
                );

                return partner.websiteUrl ? (
                  <a
                    key={partner._id}
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center h-14"
                    aria-label={partner.name}
                  >
                    {inner}
                  </a>
                ) : (
                  <div
                    key={partner._id}
                    className="flex items-center justify-center h-14"
                  >
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Section 5: Partner des Tages ────────────────────────────── */}
      {partnerOfDay && (
        <PartnerOfDaySection partner={partnerOfDay} />
      )}
    </>
  );
}

// ─── Partner des Tages ────────────────────────────────────────────────────────

function PartnerOfDaySection({ partner }: { partner: Partner }) {
  const logoUrl = partner.logo
    ? urlFor(partner.logo).width(400).height(160).url()
    : null;

  const card = (
    <div className="group flex flex-col sm:flex-row items-center gap-6 sm:gap-10 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      {/* Left accent stripe */}
      <div className="hidden sm:block w-1 self-stretch bg-primary shrink-0" />

      {/* Logo */}
      <div className="flex items-center justify-center shrink-0 pt-8 sm:pt-0 sm:pl-6 sm:py-8">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={partner.name}
            width={200}
            height={80}
            className="object-contain max-h-[80px] w-auto"
          />
        ) : (
          <span className="text-xl font-black text-text dark:text-gray-100 uppercase tracking-tight">
            {partner.name}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px self-stretch bg-gray-100 dark:bg-gray-700" />

      {/* Text */}
      <div className="flex flex-col pb-8 sm:py-8 px-6 sm:pl-0 sm:pr-8 flex-1 text-center sm:text-left">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted dark:text-gray-400 mb-1">
          Partner des Tages
        </span>
        <p className="font-black text-text dark:text-gray-100 text-lg leading-tight">
          {partner.name}
        </p>
        {partner.description && (
          <p className="text-muted dark:text-gray-400 text-sm mt-1.5 leading-relaxed">
            {partner.description}
          </p>
        )}
        {partner.websiteUrl && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-primary group-hover:text-primary-light transition-colors mt-4">
            <ExternalLink size={11} />
            Website besuchen
          </span>
        )}
      </div>
    </div>
  );

  return (
    <section className="bg-background dark:bg-gray-900 py-10 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {partner.websiteUrl ? (
          <a
            href={partner.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Partner des Tages: ${partner.name}`}
          >
            {card}
          </a>
        ) : (
          card
        )}
      </div>
    </section>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted dark:text-gray-400 mb-2">
        {label}
      </p>
      <h2 className="text-2xl md:text-3xl font-black text-text dark:text-gray-100 uppercase tracking-tight">
        {title}
      </h2>
    </div>
  );
}

function MatchCard({ match, isResult }: { match: Match; isResult: boolean }) {
  const date = new Date(match.date);
  const dateStr = new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const timeStr = new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Top accent bar */}
      <div className={`h-[3px] ${isResult ? "bg-accent" : "bg-primary"}`} />
      <div className="p-5">
        {/* Badge */}
        <span
          className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded mb-4 ${
            isResult
              ? "bg-accent/10 text-accent"
              : "bg-primary/10 text-primary"
          }`}
        >
          {isResult ? "Ergebnis" : "Nächstes Spiel"}
        </span>

        {/* Teams */}
        <p className="font-black text-text dark:text-gray-100 text-base leading-tight">
          {match.homeTeam}
        </p>
        <p className="text-muted dark:text-gray-400 text-sm mt-0.5">vs. {match.awayTeam}</p>

        {/* Result / Time */}
        {isResult && match.result ? (
          <p className="text-3xl font-black text-primary mt-4 tabular-nums">
            {match.result}
          </p>
        ) : (
          <p className="text-2xl font-black text-accent mt-4 tabular-nums">
            {timeStr} Uhr
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <span className="flex items-center gap-1.5 text-[11px] text-muted dark:text-gray-400">
            <Calendar size={11} className="shrink-0" />
            {dateStr}
          </span>
          {match.venue && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted dark:text-gray-400">
              <MapPin size={11} className="shrink-0" />
              {match.venue}
            </span>
          )}
          {match.isHomeGame !== undefined && (
            <span
              className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${
                match.isHomeGame ? "text-primary" : "text-muted dark:text-gray-400"
              }`}
            >
              <Trophy size={10} className="shrink-0" />
              {match.isHomeGame ? "Heimspiel" : "Auswärts"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  herren:  { bg: "bg-accent/10",      text: "text-accent",      label: "Herren"  },
  damen:   { bg: "bg-rose-100",        text: "text-rose-600",    label: "Damen"   },
  jugend:  { bg: "bg-emerald-100",     text: "text-emerald-700", label: "Jugend"  },
  verein:  { bg: "bg-gray-100",        text: "text-gray-600",    label: "Verein"  },
};

function NewsCard({ article }: { article: NewsArticle }) {
  const imageUrl = article.mainImage
    ? urlFor(article.mainImage).width(640).height(360).url()
    : null;

  const dateStr = article.publishedAt
    ? new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(article.publishedAt))
    : null;

  const category = article.category
    ? CATEGORY_STYLES[article.category] ?? CATEGORY_STYLES.verein
    : null;

  return (
    <Link
      href={`/news/${article.slug.current}`}
      className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 flex flex-col"
    >
      {/* Thumbnail */}
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
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <span className="text-4xl font-black text-accent/15 select-none">NEWS</span>
          </div>
        )}
      </div>

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
            <span className="text-[11px] text-muted ml-auto">{dateStr}</span>
          )}
        </div>

        <h3 className="font-black text-text dark:text-gray-100 text-base leading-snug mb-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>

        {article.teaser && (
          <p className="text-muted dark:text-gray-400 text-sm leading-relaxed line-clamp-3 flex-1">
            {article.teaser}
          </p>
        )}

        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary uppercase tracking-wider mt-4 group-hover:gap-2 transition-all">
          Lesen <ArrowRight size={11} />
        </span>
      </div>
    </Link>
  );
}
