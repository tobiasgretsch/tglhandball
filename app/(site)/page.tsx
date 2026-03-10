import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ExternalLink, FileText } from "lucide-react";
import PdfOpenButton from "@/components/sections/PdfOpenButton";
import { client, urlFor } from "@/lib/sanity";
import {
  settingsQuery,
  latestNewsQuery,
  allTeamsQuery,
  partnerOfTheDayQuery,
  homeMagazineQuery,
} from "@/lib/queries";
import type { Settings, NewsArticle, Team, TeamCategory, Magazine, Partner } from "@/types";
import HeroSection from "@/components/sections/HeroSection";

// ─── Metadata ────────────────────────────────────────────────────────────────

// Metadata is enhanced at runtime by the root layout's metadataBase.
// The hero image is fetched in the page body; here we set static defaults.
export const metadata: Metadata = {
  title: "TG MIPA Landshut Handball – Leidenschaft seit Jahrzehnten",
  description:
    "Offizielle Website des TG MIPA Landshut. Aktuelle News, Spielplan, Mannschaften und mehr.",
  openGraph: {
    title: "TG MIPA Landshut Handball",
    description: "Handball in Landshut – Leidenschaft seit Jahrzehnten.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const revalidate = 300;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD" — magazine date filter

  const [settings, news, teams, partnerOfDay, upcomingMagazine] =
    await Promise.all([
      client
        .fetch<Settings>(settingsQuery, {}, { next: { revalidate: 3600 } })
        .catch(() => null),
      client
        .fetch<NewsArticle[]>(latestNewsQuery, {}, { next: { revalidate: 300 } })
        .catch(() => [] as NewsArticle[]),
      client
        .fetch<Team[]>(allTeamsQuery, {}, { next: { revalidate: 3600 } })
        .catch(() => [] as Team[]),
      client
        .fetch<Partner | null>(partnerOfTheDayQuery, {}, { next: { revalidate: 3600 } })
        .catch(() => null),
      client
        .fetch<Magazine | null>(homeMagazineQuery, { today }, { next: { revalidate: 3600 } })
        .catch(() => null),
    ]);

  const heroImageUrl = settings?.heroImage
    ? urlFor(settings.heroImage).width(1920).height(1080).url()
    : null;

  return (
    <>
      {/* ── Section 1: Hero ─────────────────────────────────────────── */}
      <HeroSection
        heroImageUrl={heroImageUrl}
        clubName={settings?.clubName ?? "TG MIPA Landshut"}
      />

      {/* ── Section 2: Partner des Tages ────────────────────────────── */}
      {partnerOfDay && (
        <PartnerOfDaySection partner={partnerOfDay} />
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

      {/* ── Section 4: Mannschaften ─────────────────────────────────── */}
      {teams.length > 0 && (
        <section className="bg-white dark:bg-gray-800 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <SectionHeader label="Mannschaften" title="Unsere Teams" />
              <Link
                href="/teams"
                className="hidden sm:inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-primary hover:text-primary-light transition-colors shrink-0"
              >
                Alle Teams <ArrowRight size={14} />
              </Link>
            </div>

            {/* Category buttons — all screen sizes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {HOME_TEAM_GROUPS.filter(({ key }) =>
                teams.some((t) => t.category === key)
              ).map(({ key, label }) => (
                <Link
                  key={key}
                  href={`/teams#${key}`}
                  className="flex items-center justify-between px-5 py-4 md:py-6 bg-background dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 font-bold text-sm uppercase tracking-wide text-text dark:text-gray-100 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
                >
                  {label}
                  <ArrowRight size={14} className="shrink-0" />
                </Link>
              ))}
            </div>

            {/* Mobile only — desktop link is in the section header */}
            <div className="mt-8 sm:hidden">
              <Link
                href="/teams"
                className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-primary hover:text-primary-light transition-colors"
              >
                Alle Teams <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Section 5: Spieltagsmagazin ─────────────────────────────── */}
      {upcomingMagazine && upcomingMagazine.pdfFile?.asset?.url && (
        <MagazineTeaser magazine={upcomingMagazine} />
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

// ─── Spieltagsmagazin Teaser ──────────────────────────────────────────────────

function MagazineTeaser({ magazine }: { magazine: Magazine }) {
  const pdfUrl = magazine.pdfFile!.asset.url!;

  const dateStr = magazine.date
    ? new Intl.DateTimeFormat("de-DE", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(magazine.date))
    : null;

  const meta = [
    magazine.season,
    magazine.matchday ? `Spieltag ${magazine.matchday}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="bg-white dark:bg-gray-800 py-16 md:py-20 border-t border-gray-100 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:gap-12 lg:gap-20">
        <div className="shrink-0 mb-8 md:mb-0">
          <SectionHeader label="Aktuell" title="Spieltagsmagazin" />
        </div>

        <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 ml-auto max-w-2xl w-full">
          {/* Red header */}
          <div className="bg-primary px-5 py-3 flex items-center gap-2.5">
            <FileText size={15} className="text-white/75 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/90">
              Spieltagsmagazin
            </span>
          </div>

          {/* Body: stacked on mobile, side-by-side on sm+ */}
          <div className="bg-background dark:bg-gray-900 flex flex-col sm:flex-row sm:items-stretch">
            {/* Info */}
            <div className="px-5 py-5 flex-1">
              {meta && (
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted dark:text-gray-400 mb-1">
                  {meta}
                </p>
              )}
              <p className="font-black text-text dark:text-gray-100 text-base leading-tight">
                {magazine.opponent ? `vs. ${magazine.opponent}` : "Spieltagsheft"}
              </p>
              {dateStr && (
                <p className="text-sm text-muted dark:text-gray-400 mt-0.5">{dateStr}</p>
              )}
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 sm:py-5 sm:pl-5 sm:pr-5 flex flex-col gap-2.5 shrink-0 sm:justify-center sm:border-l border-gray-100 dark:border-gray-700">
              <PdfOpenButton url={pdfUrl} label="Lesen" />
              <Link
                href="/spieltagsmagazin"
                className="inline-flex items-center justify-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-primary hover:text-primary-light transition-colors"
              >
                Alle Magazine <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
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

// ─── Teams section ────────────────────────────────────────────────────────────

const HOME_TEAM_GROUPS: { key: TeamCategory; label: string }[] = [
  { key: "herren",   label: "Herren" },
  { key: "damen",    label: "Damen" },
  { key: "jugend_m", label: "Jugend männlich" },
  { key: "jugend_w", label: "Jugend weiblich" },
];

// ─── News section ─────────────────────────────────────────────────────────────

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
