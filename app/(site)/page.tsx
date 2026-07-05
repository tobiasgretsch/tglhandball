import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ExternalLink, FileText } from "lucide-react";
import PdfOpenButton from "@/components/sections/PdfOpenButton";
import Reveal from "@/components/ui/Reveal";
import { client, urlFor } from "@/lib/sanity";
import {
  settingsQuery,
  latestNewsQuery,
  allTeamsQuery,
  partnerOfTheDayQuery,
  homeMagazineQuery,
  topSponsorsQuery,
  homeUpcomingMatchesQuery,
  latestResultQuery,
} from "@/lib/queries";
import type {
  Settings,
  NewsArticle,
  Team,
  TeamCategory,
  Magazine,
  Partner,
  Match,
} from "@/types";
import HeroSection from "@/components/sections/HeroSection";
import MatchdaySection from "@/components/sections/MatchdaySection";

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
  const now = new Date().toISOString(); // match date filter
  const today = now.slice(0, 10); // "YYYY-MM-DD" — magazine date filter

  const [settings, news, teams, partnerOfDay, upcomingMagazine, topSponsors, upcomingMatches, lastResult] =
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
      client
        .fetch<Partner[]>(topSponsorsQuery, {}, { next: { revalidate: 3600 } })
        .catch(() => [] as Partner[]),
      client
        .fetch<Match[]>(homeUpcomingMatchesQuery, { now }, { next: { revalidate: 300 } })
        .catch(() => [] as Match[]),
      client
        .fetch<Match | null>(latestResultQuery, {}, { next: { revalidate: 300 } })
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
        heroImageBlurDataURL={settings?.heroImage?.lqip ?? undefined}
        clubName={settings?.clubName ?? "TG MIPA Landshut"}
      />

      {/* ── Section 2: Spieltag — nächstes Spiel + letztes Ergebnis ── */}
      <MatchdaySection upcoming={upcomingMatches} lastResult={lastResult} />

      {/* ── Section 3: Neuigkeiten ───────────────────────────────────── */}
      <section className="bg-background dark:bg-gray-900 py-16 md:py-20" aria-labelledby="news-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="flex items-end justify-between mb-10">
            <SectionTitle id="news-heading" title="Aktuelles" />
            <Link
              href="/news"
              className="hidden sm:inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-primary hover:text-primary-light dark:text-primary-glow transition-colors shrink-0 mb-1"
            >
              Alle News <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </Reveal>

          {news.length === 0 ? (
            <p className="text-muted dark:text-gray-400 text-sm">
              Noch keine News vorhanden. Bitte Artikel im CMS anlegen.
            </p>
          ) : (
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Featured — der neueste Artikel bekommt die Bühne */}
              <Reveal className="lg:col-span-7">
                <FeaturedNewsCard article={news[0]} />
              </Reveal>

              {/* Kompakte Liste — die restlichen Artikel als Zeilen */}
              {news.length > 1 && (
                <div className="lg:col-span-5 flex flex-col divide-y divide-gray-200 dark:divide-gray-700">
                  {news.slice(1).map((article, i) => (
                    <Reveal key={article._id} delay={0.08 * (i + 1)}>
                      <CompactNewsRow article={article} />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 sm:hidden">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-primary dark:text-primary-glow hover:text-primary-light transition-colors"
            >
              Alle News <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section 4: Mannschaften ─────────────────────────────────── */}
      {teams.length > 0 && (
        <section
          className="bg-white dark:bg-gray-800 clip-diagonal-t pt-24 md:pt-28 pb-16 md:pb-20"
          aria-labelledby="teams-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="flex items-end justify-between mb-10">
              <SectionTitle id="teams-heading" title="Unsere Teams" />
              <Link
                href="/teams"
                className="hidden sm:inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-primary hover:text-primary-light dark:text-primary-glow transition-colors shrink-0 mb-1"
              >
                Alle Teams <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-5">
              {buildTeamTiles(teams).map((tile, i) => (
                <Reveal key={tile.category} delay={0.07 * i} className={tile.span}>
                  <TeamTile tile={tile} />
                </Reveal>
              ))}
            </div>

            {/* Mobile only — desktop link is in the section header */}
            <div className="mt-8 sm:hidden">
              <Link
                href="/teams"
                className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-primary dark:text-primary-glow hover:text-primary-light transition-colors"
              >
                Alle Teams <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Section 5: Top-Sponsoren ────────────────────────────────── */}
      {topSponsors.length > 0 && (
        <TopSponsorsSection sponsors={topSponsors} />
      )}

      {/* ── Section 6: Partner des Tages ────────────────────────────── */}
      {partnerOfDay && (
        <PartnerOfDaySection partner={partnerOfDay} />
      )}

      {/* ── Section 7: Spieltagsmagazin ─────────────────────────────── */}
      {upcomingMagazine && upcomingMagazine.pdfFile?.asset?.url && (
        <MagazineTeaser magazine={upcomingMagazine} />
      )}
    </>
  );
}

// ─── Section title — the one branded heading pattern of the site ─────────────

function SectionTitle({ title, id }: { title: string; id?: string }) {
  return (
    <div>
      <h2
        id={id}
        className="font-display font-bold italic uppercase text-4xl md:text-5xl tracking-tight text-text dark:text-gray-100"
      >
        {title}
      </h2>
      <div className="mt-2 h-1.5 w-16 bg-primary -skew-x-12" aria-hidden="true" />
    </div>
  );
}

// ─── News section ─────────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  herren:  { bg: "bg-accent/10",      text: "text-accent",      label: "Herren"  },
  damen:   { bg: "bg-rose-100",        text: "text-rose-600",    label: "Damen"   },
  jugend:  { bg: "bg-emerald-100",     text: "text-emerald-700", label: "Jugend"  },
  verein:  { bg: "bg-gray-100",        text: "text-gray-600",    label: "Verein"  },
};

function formatNewsDate(publishedAt: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(publishedAt));
}

function CategoryChip({ category }: { category?: string }) {
  if (!category) return null;
  const style = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.verein;
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}

/** Featured article — large image with a text panel overlapping the lower edge. */
function FeaturedNewsCard({ article }: { article: NewsArticle }) {
  const imageUrl = article.mainImage
    ? urlFor(article.mainImage).width(1200).height(675).url()
    : null;

  return (
    <Link href={`/news/${article.slug.current}`} className="group block">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-accent-tint dark:bg-gray-700">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            placeholder={article.mainImage?.lqip ? "blur" : "empty"}
            blurDataURL={article.mainImage?.lqip ?? undefined}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display font-bold italic text-6xl text-accent/15 uppercase select-none">
              News
            </span>
          </div>
        )}
      </div>

      {/* Text panel — overlaps the image, breaks the card rectangle */}
      <div className="relative -mt-14 md:-mt-20 ml-0 sm:ml-8 mr-0 sm:mr-4 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-7">
        <div className="flex items-center gap-3 mb-3">
          <CategoryChip category={article.category} />
          {article.publishedAt && (
            <span className="text-[11px] text-muted dark:text-gray-400 ml-auto">
              {formatNewsDate(article.publishedAt)}
            </span>
          )}
        </div>
        <h3 className="font-display font-bold uppercase text-2xl md:text-3xl leading-[1.02] text-text dark:text-gray-100 group-hover:text-primary dark:group-hover:text-primary-glow transition-colors text-balance">
          {article.title}
        </h3>
        {article.teaser && (
          <p className="text-muted dark:text-gray-400 text-sm leading-relaxed line-clamp-2 mt-3">
            {article.teaser}
          </p>
        )}
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary dark:text-primary-glow uppercase tracking-wider mt-4 group-hover:gap-2 transition-all">
          Lesen <ArrowRight size={11} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

/** Compact article row — thumbnail + title, for the secondary news column. */
function CompactNewsRow({ article }: { article: NewsArticle }) {
  const imageUrl = article.mainImage
    ? urlFor(article.mainImage).width(320).height(180).url()
    : null;

  return (
    <Link
      href={`/news/${article.slug.current}`}
      className="group flex gap-4 py-5 first:pt-0 last:pb-0"
    >
      <div className="relative w-28 sm:w-32 aspect-video shrink-0 overflow-hidden rounded-md bg-accent-tint dark:bg-gray-700">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            sizes="128px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            placeholder={article.mainImage?.lqip ? "blur" : "empty"}
            blurDataURL={article.mainImage?.lqip ?? undefined}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display font-bold italic text-lg text-accent/20 uppercase select-none">
              News
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2.5 mb-1.5">
          <CategoryChip category={article.category} />
          {article.publishedAt && (
            <span className="text-[11px] text-muted dark:text-gray-400">
              {formatNewsDate(article.publishedAt)}
            </span>
          )}
        </div>
        <h3 className="font-display font-bold uppercase text-lg leading-tight text-text dark:text-gray-100 group-hover:text-primary dark:group-hover:text-primary-glow transition-colors line-clamp-2">
          {article.title}
        </h3>
      </div>
    </Link>
  );
}

// ─── Teams section ────────────────────────────────────────────────────────────

const HOME_TEAM_GROUPS: { key: TeamCategory; label: string }[] = [
  { key: "herren",   label: "Herren" },
  { key: "damen",    label: "Damen" },
  { key: "jugend_m", label: "Jugend männlich" },
  { key: "jugend_w", label: "Jugend weiblich" },
];

// Asymmetric 12-col spans — wide/narrow alternation instead of a uniform grid
const TILE_SPANS = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7"];

interface TeamTileData {
  category: TeamCategory;
  label: string;
  teamCount: number;
  image: Team["headerImage"] | null;
  span: string;
}

function buildTeamTiles(teams: Team[]): TeamTileData[] {
  return HOME_TEAM_GROUPS.map(({ key, label }) => {
    const group = teams.filter((t) => t.category === key);
    return {
      category: key,
      label,
      teamCount: group.length,
      image: group.find((t) => t.headerImage)?.headerImage ?? null,
    };
  })
    .filter((tile) => tile.teamCount > 0)
    .map((tile, i) => ({ ...tile, span: TILE_SPANS[i % TILE_SPANS.length] }));
}

function TeamTile({ tile }: { tile: TeamTileData }) {
  const imageUrl = tile.image
    ? urlFor(tile.image).width(1000).height(560).url()
    : null;

  return (
    <Link
      href={`/teams#${tile.category}`}
      className="group relative block h-52 md:h-64 overflow-hidden rounded-lg bg-accent"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${tile.label} — Mannschaftsfoto`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 58vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          placeholder={tile.image?.lqip ? "blur" : "empty"}
          blurDataURL={tile.image?.lqip ?? undefined}
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute -right-2 -top-4 font-display font-bold italic uppercase text-8xl text-white/10 select-none"
        >
          {tile.label.charAt(0)}
        </span>
      )}

      {/* Legibility overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-accent-dark/90 via-accent-dark/25 to-transparent" />

      {/* Red wipe — slides in behind the label on hover */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-1.5 w-24 bg-primary -skew-x-12 -translate-x-2 group-hover:w-full transition-all duration-500 ease-out motion-reduce:transition-none"
      />

      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
        <p className="font-display font-bold italic uppercase text-3xl md:text-4xl text-white leading-none">
          {tile.label}
        </p>
        <p className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-white/85 mt-2 group-hover:gap-2.5 transition-all">
          {tile.teamCount === 1 ? "1 Mannschaft" : `${tile.teamCount} Mannschaften`}
          <ArrowRight size={13} aria-hidden="true" />
        </p>
      </div>
    </Link>
  );
}

// ─── Top-Sponsoren (Hauptsponsor + Exclusiv-Partner) ─────────────────────────
// Gold ist die bewusste, benannte Ausnahme von der Zwei-Farben-Identität:
// ausschließlich in dieser Sektion, ausschließlich als Premium-Signal.

function TopSponsorsSection({ sponsors }: { sponsors: Partner[] }) {
  return (
    <section className="relative bg-white dark:bg-gray-900 overflow-hidden py-12 md:py-16 border-t border-b border-gray-100 dark:border-gray-800">
      {/* Subtle gold shimmer lines */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" aria-hidden="true" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/25 to-transparent" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading with decorative rule */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-400/40 dark:to-amber-400/35" aria-hidden="true" />
          <div className="flex items-center gap-2.5">
            <span className="text-amber-500/80 dark:text-amber-400/70 text-[9px] leading-none" aria-hidden="true">★</span>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-800 dark:text-amber-400/80">
              Exclusiv-Partner
            </p>
            <span className="text-amber-500/80 dark:text-amber-400/70 text-[9px] leading-none" aria-hidden="true">★</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-400/40 dark:to-amber-400/35" aria-hidden="true" />
        </div>

        {/* Centered logo cards */}
        <div className="flex flex-wrap justify-center gap-6">
          {sponsors.map((sponsor) => {
            const logoUrl = sponsor.logo
              ? urlFor(sponsor.logo).width(440).height(248).fit("max").url()
              : null;

            const card = (
              <div className="flex items-center shrink-0 rounded px-5 py-4 transition-all duration-300 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md hover:border-amber-400/50 dark:hover:border-amber-400/40 hover:shadow-[0_0_18px_rgba(251,191,36,0.10)]">
                {logoUrl ? (
                  <div className="relative" style={{ width: 220, height: 124 }}>
                    <Image
                      src={logoUrl}
                      alt={sponsor.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div style={{ width: 220, height: 124 }} className="flex items-center justify-center">
                    <span className="font-bold text-text dark:text-white/85 uppercase tracking-wider text-center text-lg">
                      {sponsor.name}
                    </span>
                  </div>
                )}
              </div>
            );

            return sponsor.websiteUrl ? (
              <a
                key={sponsor._id}
                href={sponsor.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${sponsor.name} – Website besuchen`}
              >
                {card}
              </a>
            ) : (
              <div key={sponsor._id}>{card}</div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/partner"
            className="inline-flex items-center gap-2 border border-amber-500/50 text-amber-800 hover:text-amber-900 hover:border-amber-500/80 hover:bg-amber-50 dark:border-amber-400/40 dark:text-amber-400/80 dark:hover:text-amber-400 dark:hover:border-amber-400/70 dark:hover:bg-amber-400/5 text-[12px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-sm transition-all duration-200"
          >
            Alle Partner ansehen
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Partner des Tages ────────────────────────────────────────────────────────

function PartnerOfDaySection({ partner }: { partner: Partner }) {
  const logoUrl = partner.logo
    ? urlFor(partner.logo).width(400).height(160).url()
    : null;

  const band = (
    <div className="group flex flex-col sm:flex-row items-center gap-5 sm:gap-8 text-center sm:text-left">
      {/* Logo */}
      <div className="flex items-center justify-center shrink-0">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={partner.name}
            width={180}
            height={72}
            className="object-contain max-h-[72px] w-auto"
          />
        ) : (
          <span className="font-display font-bold italic text-2xl text-text dark:text-gray-100 uppercase">
            {partner.name}
          </span>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="inline-block bg-accent text-white font-display font-bold italic uppercase text-sm px-3 py-0.5 -skew-x-12 mb-2">
          <span className="inline-block skew-x-12">Partner des Tages</span>
        </p>
        <p className="font-display font-bold uppercase text-xl text-text dark:text-gray-100 leading-tight">
          {partner.name}
        </p>
        {partner.description && (
          <p className="text-muted dark:text-gray-400 text-sm mt-1 leading-relaxed">
            {partner.description}
          </p>
        )}
      </div>

      {partner.websiteUrl && (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-primary dark:text-primary-glow group-hover:text-primary-light transition-colors shrink-0">
          <ExternalLink size={11} aria-hidden="true" />
          Website besuchen
        </span>
      )}
    </div>
  );

  return (
    <section className="bg-background dark:bg-gray-900 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {partner.websiteUrl ? (
          <a
            href={partner.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Partner des Tages: ${partner.name}`}
          >
            {band}
          </a>
        ) : (
          band
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
    <section className="bg-white dark:bg-gray-800 py-16 md:py-20 border-t border-gray-100 dark:border-gray-700" aria-labelledby="magazine-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:gap-12 lg:gap-20">
        <Reveal className="shrink-0 mb-8 md:mb-0">
          <SectionTitle id="magazine-heading" title="Spieltagsmagazin" />
        </Reveal>

        <Reveal className="rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 ml-auto max-w-2xl w-full" delay={0.1}>
          {/* Red header */}
          <div className="bg-primary px-5 py-3 flex items-center gap-2.5">
            <FileText size={15} className="text-white/75 shrink-0" aria-hidden="true" />
            <span className="font-display font-bold italic uppercase text-base text-white/95">
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
              <p className="font-display font-bold uppercase text-text dark:text-gray-100 text-xl leading-tight">
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
                className="inline-flex items-center justify-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-primary dark:text-primary-glow hover:text-primary-light transition-colors"
              >
                Alle Magazine <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
