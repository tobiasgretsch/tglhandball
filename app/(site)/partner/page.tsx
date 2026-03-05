import type { Metadata } from "next";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { client, urlFor } from "@/lib/sanity";
import { activePartnersQuery, pageHeroSlidesQuery } from "@/lib/queries";
import type { Partner, SanityImage } from "@/types";
import PageHeroSlider from "@/components/sections/PageHeroSlider";

export const metadata: Metadata = {
  title: "Unsere Partner | TG MIPA Landshut Handball",
  description:
    "Die Partner des TG MIPA Landshut Handball – Danke für eure Unterstützung.",
};

export const revalidate = 3600;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PartnerPage() {
  const [partners, slides] = await Promise.all([
    client
      .fetch<Partner[]>(activePartnersQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as Partner[]),
    client
      .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as SanityImage[]),
  ]);

  // Split and sort alphabetically within each tier
  const premium = partners
    .filter((p) => p.tier === "premium")
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  const standard = partners
    .filter((p) => p.tier === "standard")
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

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

          {/* Section 1: Premium partners */}
          {premium.length > 0 && (
            <section>
              <SectionHeading accent="bg-primary" label="Premiumpartner" />
              <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {premium.map((partner) => (
                  <PremiumCard key={partner._id} partner={partner} />
                ))}
              </div>
            </section>
          )}

          {/* Section 2: Standard partners */}
          {standard.length > 0 && (
            <section>
              <SectionHeading accent="bg-accent" label="Partner" />
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {standard.map((partner) => (
                  <StandardTile key={partner._id} partner={partner} />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {premium.length === 0 && standard.length === 0 && (
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

// ─── Premium card ─────────────────────────────────────────────────────────────

function PremiumCard({ partner }: { partner: Partner }) {
  const logoUrl = partner.logo
    ? urlFor(partner.logo).width(400).height(200).url()
    : null;

  const inner = (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group">
      {/* Top accent bar */}
      <div className="h-[3px] bg-primary" />

      {/* Logo area */}
      <div className="flex items-center justify-center px-8 py-10 bg-gray-50/60 dark:bg-gray-700/60 min-h-[160px]">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={partner.name}
            width={200}
            height={100}
            className="object-contain max-h-[100px] w-auto transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-2xl font-black text-text/20 uppercase tracking-tight text-center">
            {partner.name}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1 border-t border-gray-100 dark:border-gray-700">
        <p className="font-black text-text dark:text-gray-100 text-base leading-tight">
          {partner.name}
        </p>

        {partner.description && (
          <p className="text-muted dark:text-gray-400 text-sm mt-2 leading-relaxed flex-1">
            {partner.description}
          </p>
        )}

        {partner.websiteUrl && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
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

// ─── Standard tile ────────────────────────────────────────────────────────────

function StandardTile({ partner }: { partner: Partner }) {
  const logoUrl = partner.logo
    ? urlFor(partner.logo).width(240).height(120).url()
    : null;

  const inner = (
    // `group` on this div drives the tooltip visibility
    <div className="relative group flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200 aspect-[3/2] overflow-visible px-5 py-4 cursor-pointer">
      {/* Tooltip */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-text px-2.5 py-1 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 shadow-md"
      >
        {partner.name}
        {/* Downward arrow */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-text" />
      </span>

      {/* Logo or name fallback */}
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={partner.name}
          width={120}
          height={60}
          className="object-contain max-h-[60px] w-auto grayscale hover:grayscale-0 opacity-70 group-hover:opacity-100 transition-all duration-200"
        />
      ) : (
        <span className="text-[12px] font-bold text-muted text-center leading-tight group-hover:text-text transition-colors">
          {partner.name}
        </span>
      )}
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
