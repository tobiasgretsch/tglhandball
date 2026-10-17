import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";
import { client } from "@/lib/sanity";
import {
  activePartnersQuery,
  pageHeroSlidesQuery,
  partnerPageSettingsQuery,
} from "@/lib/queries";
import type { Partner, SanityImage, Settings } from "@/types";
import Reveal from "@/components/ui/Reveal";
import PageHeroSlider from "@/components/sections/PageHeroSlider";
import PartnerInfoBlock from "@/components/sections/PartnerInfoBlock";
import {
  HallenPartnerBanner,
  HauptsponsorCard,
  PartnerTile,
  PremiumCard,
} from "@/components/sections/PartnerCards";

export const metadata: Metadata = {
  alternates: { canonical: "/partner" },
  title: "Unsere Partner",
  description:
    "Die Partner und Sponsoren des TG MIPA Landshut – ein herzliches Dankeschön für eure Unterstützung.",
  openGraph: {
    title: "Unsere Partner | TG MIPA Landshut",
    description:
      "Die Partner und Sponsoren des TG MIPA Landshut – ein herzliches Dankeschön für eure Unterstützung.",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE.url] },
};

export const revalidate = 3600;

/** Max stagger steps inside one list, so long grids never feel slow. */
const MAX_STAGGER_STEPS = 6;
const STAGGER_SECONDS = 0.05;

/** Section headings shrink with the tier, so the hierarchy reads before the logos do. */
const HEADING_SIZE = {
  lg: "text-4xl md:text-5xl",
  md: "text-3xl md:text-4xl",
  sm: "text-2xl md:text-3xl",
} as const;

const TILE_GRID = "grid grid-cols-2 gap-3 sm:gap-4";

const staggerDelay = (index: number) =>
  Math.min(index, MAX_STAGGER_STEPS) * STAGGER_SECONDS;

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

  const hasAny = partners.length > 0;

  return (
    <>
      <PageHeroSlider
        slides={slides ?? []}
        title="Unsere Partner"
        subtitle="Ein herzliches Dankeschön an alle Partner, die den Handball in Landshut möglich machen."
      />

      <div className="bg-background dark:bg-gray-900">
        <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:px-6 md:space-y-24 md:py-20 lg:px-8">
          {hauptsponsor.length > 0 && (
            <TierSection label="Hauptsponsor" size="lg">
              <div className="space-y-6">
                {hauptsponsor.map((partner) => (
                  <Reveal key={partner._id}>
                    <HauptsponsorCard partner={partner} />
                  </Reveal>
                ))}
              </div>
            </TierSection>
          )}

          {exclusiv.length > 0 && (
            <TierSection label="Exclusiv-Partner Hallenname" size="md">
              <div className="space-y-6">
                {exclusiv.map((partner) => (
                  <Reveal key={partner._id}>
                    <HallenPartnerBanner partner={partner} />
                  </Reveal>
                ))}
              </div>
            </TierSection>
          )}

          {premium.length > 0 && (
            <TierSection label="Premiumpartner" size="md">
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {premium.map((partner, i) => (
                  <Reveal key={partner._id} delay={staggerDelay(i)} className="h-full">
                    <PremiumCard partner={partner} />
                  </Reveal>
                ))}
              </div>
            </TierSection>
          )}

          {topPartner.length > 0 && (
            <TierSection label="Top-Partner" size="sm">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {topPartner.map((partner, i) => (
                  <Reveal key={partner._id} delay={staggerDelay(i)} className="h-full">
                    <PartnerTile partner={partner} />
                  </Reveal>
                ))}
              </div>
            </TierSection>
          )}

          {(fitness.length > 0 || supporter.length > 0) && (
            <div className="grid gap-16 md:grid-cols-2 md:gap-10">
              {fitness.length > 0 && (
                <TierSection label="Fitness-Partner" size="sm">
                  <div className={TILE_GRID}>
                    {fitness.map((partner, i) => (
                      <Reveal key={partner._id} delay={staggerDelay(i)} className="h-full">
                        <PartnerTile partner={partner} />
                      </Reveal>
                    ))}
                  </div>
                </TierSection>
              )}
              {supporter.length > 0 && (
                <TierSection label="Supporter-Club" size="sm">
                  <div className={TILE_GRID}>
                    {supporter.map((partner, i) => (
                      <Reveal key={partner._id} delay={staggerDelay(i)} className="h-full">
                        <PartnerTile partner={partner} />
                      </Reveal>
                    ))}
                  </div>
                </TierSection>
              )}
            </div>
          )}

          {!hasAny && (
            <p className="py-16 text-center text-sm text-muted">
              Noch keine Partner hinterlegt. Bitte Partner im CMS anlegen.
            </p>
          )}

          <Reveal>
            <PartnerInfoBlock
              text={pageSettings?.partnerPageText}
              pdfUrl={pageSettings?.partnerInfoPdf?.asset?.url}
            />
          </Reveal>
        </div>
      </div>
    </>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function TierSection({
  label,
  size,
  children,
}: {
  label: string;
  size: keyof typeof HEADING_SIZE;
  children: ReactNode;
}) {
  return (
    <section aria-label={label}>
      <Reveal>
        <h2
          className={`mb-6 font-display font-bold italic uppercase leading-none tracking-[-0.02em] text-text dark:text-gray-100 md:mb-8 ${HEADING_SIZE[size]}`}
        >
          {label}
        </h2>
      </Reveal>
      {children}
    </section>
  );
}
