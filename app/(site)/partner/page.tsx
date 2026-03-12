import type { Metadata } from "next";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { client, urlFor } from "@/lib/sanity";
import {
  activePartnersQuery,
  pageHeroSlidesQuery,
  partnerPageSettingsQuery,
} from "@/lib/queries";
import type { Partner, SanityImage, Settings } from "@/types";
import PageHeroSlider from "@/components/sections/PageHeroSlider";
import PartnerInfoBlock from "@/components/sections/PartnerInfoBlock";

export const metadata: Metadata = {
  title: "Unsere Partner",
  description:
    "Die Partner und Sponsoren des TG MIPA Landshut – ein herzliches Dankeschön für eure Unterstützung.",
  openGraph: {
    title: "Unsere Partner | TG MIPA Landshut",
    description:
      "Die Partner und Sponsoren des TG MIPA Landshut – ein herzliches Dankeschön für eure Unterstützung.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const revalidate = 3600;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PartnerPage() {
  const [partners, slides, pageSettings] = await Promise.all([
    client
      .fetch<Partner[]>(activePartnersQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as Partner[]),
    client
      .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as SanityImage[]),
    client
      .fetch<Pick<Settings, "partnerPageText" | "partnerInfoPdf">>(
        partnerPageSettingsQuery,
        {},
        { next: { revalidate: 3600 } },
      )
      .catch(() => ({} as Pick<Settings, "partnerPageText" | "partnerInfoPdf">)),
  ]);

  const byTier = (tier: Partner["tier"]) =>
    partners
      .filter((p) => p.tier === tier)
      .sort((a, b) => a.name.localeCompare(b.name, "de"));

  const hauptsponsor = byTier("hauptsponsor");
  const exclusiv = byTier("exclusiv_hallenname");
  const premium = byTier("premium");
  const topPartner = byTier("standard");
  const fitness = byTier("fitness_partner");
  const supporter = byTier("supporter_club");

  const hasAny =
    [hauptsponsor, exclusiv, premium, topPartner, fitness, supporter].some(
      (g) => g.length > 0,
    );

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <PageHeroSlider slides={slides ?? []}>
        <span className="absolute right-6 bottom-0 text-[120px] md:text-[200px] font-black text-white/5 leading-none select-none pointer-events-none">
          PARTNER
        </span>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-[132px] lg:pt-[140px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/50 mb-3">
            TG MIPA Landshut
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight">
            Unsere Partner
          </h1>
          <p className="text-white/55 mt-3 text-base max-w-lg">
            Ein herzliches Dankeschön an alle Partner, die den Handball in
            Landshut möglich machen.
          </p>
        </div>
      </PageHeroSlider>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="bg-background dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 space-y-20">

          {/* 1 ── Hauptsponsor */}
          {hauptsponsor.length > 0 && (
            <section>
              <SectionHeading accent="bg-primary" label="Hauptsponsor" />
              <div className="mt-8 flex flex-wrap justify-center gap-6">
                {hauptsponsor.map((partner) => (
                  <div key={partner._id} className="w-full max-w-4xl">
                    <HauptsponsorCard partner={partner} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2 ── Info text + buttons */}
          <PartnerInfoBlock
            text={pageSettings?.partnerPageText}
            pdfUrl={pageSettings?.partnerInfoPdf?.asset?.url}
          />

          {/* 3 ── Exclusiv-Partner Hallenname */}
          {exclusiv.length > 0 && (
            <section>
              <SectionHeading accent="bg-primary" label="Exclusiv-Partner Hallenname" />
              <div className="mt-8 flex flex-wrap justify-center gap-6">
                {exclusiv.map((partner) => (
                  <div key={partner._id} className="w-full max-w-lg">
                    <ExclusivCard partner={partner} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4 ── Premium */}
          {premium.length > 0 && (
            <section>
              <SectionHeading accent="bg-accent" label="Premiumpartner" />
              <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {premium.map((partner) => (
                  <PremiumCard key={partner._id} partner={partner} />
                ))}
              </div>
            </section>
          )}

          {/* 5 ── Top-Partner (was "standard") */}
          {topPartner.length > 0 && (
            <section>
              <SectionHeading accent="bg-accent" label="Top-Partner" />
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
                {topPartner.map((partner) => (
                  <StandardTile key={partner._id} partner={partner} />
                ))}
              </div>
            </section>
          )}

          {/* 6 ── Fitness-Partner */}
          {fitness.length > 0 && (
            <section>
              <SectionHeading accent="bg-muted" label="Fitness-Partner" />
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
                {fitness.map((partner) => (
                  <StandardTile key={partner._id} partner={partner} />
                ))}
              </div>
            </section>
          )}

          {/* 7 ── Supporter-Club */}
          {supporter.length > 0 && (
            <section>
              <SectionHeading accent="bg-muted" label="Supporter-Club" />
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
                {supporter.map((partner) => (
                  <StandardTile key={partner._id} partner={partner} />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {!hasAny && (
            <p className="text-muted text-sm text-center py-16">
              Noch keine Partner hinterlegt. Bitte Partner im CMS anlegen.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ accent, label }: { accent: string; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className={`block w-8 h-[3px] rounded-full shrink-0 ${accent}`} />
      <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted dark:text-gray-400">
        {label}
      </h2>
    </div>
  );
}

// ─── Hauptsponsor card (largest — full prominence) ────────────────────────────

function HauptsponsorCard({ partner }: { partner: Partner }) {
  const logoUrl = partner.logo
    ? urlFor(partner.logo).width(1200).height(540).fit("max").url()
    : null;

  const inner = (
    <div className="bg-gray-300 dark:bg-gray-300 rounded-2xl border-2 border-primary/30 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group">
      {/* Top accent bar — thicker for main sponsor */}
      <div className="h-1 bg-primary" />

      {/* Logo area — 16:9, taller on desktop */}
      <div className="relative aspect-[16/7] bg-gray-300 dark:bg-gray-300 overflow-hidden">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={partner.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-8 transition-transform duration-300 group-hover:scale-105"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-8">
            <span className="text-4xl font-black text-gray-400 uppercase tracking-tight text-center">
              {partner.name}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col items-center text-center flex-1 border-t border-primary/20">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary mb-1">
          Hauptsponsor
        </p>
        <p className="font-black text-gray-900 text-xl leading-tight">
          {partner.name}
        </p>

        {partner.description && (
          <p className="text-gray-600 text-sm mt-2 leading-relaxed flex-1">
            {partner.description}
          </p>
        )}

        {partner.websiteUrl && (
          <div className="mt-4 pt-4 border-t border-primary/20 w-full">
            <span className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-primary group-hover:text-primary-light transition-colors">
              <ExternalLink size={11} />
              Website besuchen
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (partner.websiteUrl) {
    return (
      <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }

  return <div>{inner}</div>;
}

// ─── Exclusiv-Partner card (large, accent bar in accent color) ────────────────

function ExclusivCard({ partner }: { partner: Partner }) {
  const logoUrl = partner.logo
    ? urlFor(partner.logo).width(900).height(400).fit("max").url()
    : null;

  const inner = (
    <div className="bg-gray-300 dark:bg-gray-300 rounded-xl border border-accent/30 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group">
      {/* Top accent bar */}
      <div className="h-[3px] bg-accent" />

      {/* Logo area — 16:9 */}
      <div className="relative aspect-[16/9] bg-gray-300 dark:bg-gray-300 overflow-hidden">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={partner.name}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <span className="text-3xl font-black text-gray-400 uppercase tracking-tight text-center">
              {partner.name}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col items-center text-center flex-1 border-t border-accent/20">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent mb-1">
          Exclusiv-Partner
        </p>
        <p className="font-black text-gray-900 text-lg leading-tight">
          {partner.name}
        </p>

        {partner.description && (
          <p className="text-gray-600 text-sm mt-2 leading-relaxed flex-1">
            {partner.description}
          </p>
        )}

        {partner.websiteUrl && (
          <div className="mt-4 pt-4 border-t border-accent/20 w-full">
            <span className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-accent group-hover:text-primary transition-colors">
              <ExternalLink size={11} />
              Website besuchen
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (partner.websiteUrl) {
    return (
      <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }

  return <div>{inner}</div>;
}

// ─── Premium card ─────────────────────────────────────────────────────────────

function PremiumCard({ partner }: { partner: Partner }) {
  const logoUrl = partner.logo
    ? urlFor(partner.logo).width(640).height(360).fit("max").url()
    : null;

  const inner = (
    <div className="bg-gray-300 dark:bg-gray-300 rounded-xl border border-gray-400 dark:border-gray-400 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group">
      <div className="h-[3px] bg-primary" />

      <div className="relative aspect-[16/9] bg-gray-300 dark:bg-gray-300 overflow-hidden">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={partner.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <span className="text-2xl font-black text-gray-400 uppercase tracking-tight text-center">
              {partner.name}
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 border-t border-gray-400 dark:border-gray-400">
        <p className="font-black text-gray-900 text-base leading-tight">
          {partner.name}
        </p>

        {partner.description && (
          <p className="text-gray-600 text-sm mt-2 leading-relaxed flex-1">
            {partner.description}
          </p>
        )}

        {partner.websiteUrl && (
          <div className="mt-4 pt-4 border-t border-gray-400 dark:border-gray-400">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-accent group-hover:text-primary transition-colors">
              <ExternalLink size={11} />
              Website besuchen
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (partner.websiteUrl) {
    return (
      <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }

  return <div>{inner}</div>;
}

// ─── Standard tile (Top-Partner / Fitness-Partner / Supporter-Club) ───────────

function StandardTile({ partner }: { partner: Partner }) {
  const logoUrl = partner.logo
    ? urlFor(partner.logo).width(320).height(180).fit("max").url()
    : null;

  const inner = (
    <div className="group flex flex-col bg-gray-300 dark:bg-gray-300 rounded-xl border border-gray-400 dark:border-gray-400 shadow-sm hover:shadow-md hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 overflow-hidden cursor-pointer">
      <div className="relative aspect-[16/9] bg-gray-300 dark:bg-gray-300 overflow-hidden">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={partner.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <span className="text-sm font-black text-gray-400 text-center leading-tight uppercase tracking-tight">
              {partner.name}
            </span>
          </div>
        )}
      </div>

      <p className="px-3 py-2 text-[11px] font-bold text-gray-600 text-center leading-tight group-hover:text-gray-900 transition-colors truncate">
        {partner.name}
      </p>
    </div>
  );

  if (partner.websiteUrl) {
    return (
      <a
        href={partner.websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={partner.name}
      >
        {inner}
      </a>
    );
  }

  return <div>{inner}</div>;
}
