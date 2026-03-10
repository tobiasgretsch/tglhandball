import type { Metadata } from "next";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { client, urlFor } from "@/lib/sanity";
import { activePartnersQuery, pageHeroSlidesQuery } from "@/lib/queries";
import type { Partner, SanityImage } from "@/types";
import PageHeroSlider from "@/components/sections/PageHeroSlider";

export const metadata: Metadata = {
  title: "Unsere Partner",
  description:
    "Die Partner und Sponsoren des TG MIPA Landshut – ein herzliches Dankeschön für eure Unterstützung.",
  openGraph: {
    title: "Unsere Partner | TG MIPA Landshut",
    description: "Die Partner und Sponsoren des TG MIPA Landshut – ein herzliches Dankeschön für eure Unterstützung.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
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
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
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
    ? urlFor(partner.logo).width(640).height(360).fit("max").url()
    : null;

  const inner = (
    <div className="bg-gray-300 dark:bg-gray-300 rounded-xl border border-gray-400 dark:border-gray-400 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group">
      {/* Top accent bar */}
      <div className="h-[3px] bg-primary" />

      {/* Logo area — 16:9 */}
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

      {/* Body */}
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

// ─── Standard tile ────────────────────────────────────────────────────────────

function StandardTile({ partner }: { partner: Partner }) {
  const logoUrl = partner.logo
    ? urlFor(partner.logo).width(320).height(180).fit("max").url()
    : null;

  const inner = (
    <div className="group flex flex-col bg-gray-300 dark:bg-gray-300 rounded-xl border border-gray-400 dark:border-gray-400 shadow-sm hover:shadow-md hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 overflow-hidden cursor-pointer">
      {/* Logo — 16:9 */}
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

      {/* Name */}
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
