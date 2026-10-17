import type { ReactNode } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { urlFor } from "@/lib/sanity";
import type { Partner } from "@/types";

const CARD_SHADOW =
  "shadow-[0_1px_2px_rgb(0_0_0/0.06),0_16px_40px_-16px_rgb(0_0_0/0.2)]";
const CARD_SURFACE = `rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 ${CARD_SHADOW}`;
const LOGO_HOVER =
  "object-contain transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.04] motion-reduce:transition-none";

// ─── Shared building blocks ───────────────────────────────────────────────────

/** Whole card is the link when the partner has a website; a plain box otherwise. */
function PartnerLink({
  partner,
  className,
  children,
}: {
  partner: Partner;
  className: string;
  children: ReactNode;
}) {
  if (!partner.websiteUrl) return <div className={className}>{children}</div>;
  return (
    <a
      href={partner.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${partner.name} – Website besuchen`}
      className={`group press-card ${className}`}
    >
      {children}
    </a>
  );
}

/**
 * Logos are brand-coloured, so they sit on white — in dark mode too — unless the
 * partner is flagged as having a light logo. Falls back to the partner name
 * when no logo is uploaded.
 */
function LogoPlate({
  partner,
  width,
  height,
  sizes,
  padding,
  className,
  priority,
}: {
  partner: Partner;
  width: number;
  height: number;
  sizes: string;
  padding: string;
  className: string;
  priority?: boolean;
}) {
  const logoUrl = partner.logo
    ? urlFor(partner.logo).width(width).height(height).fit("max").url()
    : null;

  return (
    <div className={`relative ${partner.logoOnDark ? "bg-gray-700" : "bg-white"} ${className}`}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={partner.name}
          fill
          sizes={sizes}
          priority={priority}
          className={`${LOGO_HOVER} ${padding}`}
        />
      ) : (
        <span className={`absolute inset-0 flex items-center justify-center px-4 text-center text-sm font-black uppercase leading-tight tracking-[-0.02em] ${
            partner.logoOnDark ? "text-gray-100" : "text-gray-600"
          }`}>
          {partner.name}
        </span>
      )}
    </div>
  );
}

function VisitLabel({ className }: { className: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-semibold ${className}`}
    >
      Website besuchen
      <ArrowUpRight
        size={16}
        aria-hidden="true"
        className="transition-transform duration-200 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5"
      />
    </span>
  );
}

// ─── Tier layouts ─────────────────────────────────────────────────────────────

/** Hauptsponsor — split feature card: big logo left, story right. */
export function HauptsponsorCard({ partner }: { partner: Partner }) {
  return (
    <PartnerLink
      partner={partner}
      className={`grid overflow-hidden md:grid-cols-5 ${CARD_SURFACE}`}
    >
      <LogoPlate
        partner={partner}
        width={1000}
        height={640}
        sizes="(max-width: 768px) 100vw, 640px"
        padding="p-8 md:p-12"
        className="aspect-[16/9] md:col-span-3 md:aspect-auto md:min-h-[22rem]"
        priority
      />
      <div className="flex flex-col justify-center gap-3 border-t border-gray-100 p-6 dark:border-gray-700 md:col-span-2 md:border-l md:border-t-0 md:p-10">
        <span className="w-fit rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
          Hauptsponsor
        </span>
        <h3 className="text-2xl font-black leading-tight tracking-[-0.02em] text-text dark:text-gray-100 md:text-3xl">
          {partner.name}
        </h3>
        {partner.description && (
          <p className="text-sm leading-relaxed text-muted md:text-base">
            {partner.description}
          </p>
        )}
        {partner.websiteUrl && <VisitLabel className="mt-2 text-brand-red" />}
      </div>
    </PartnerLink>
  );
}

/** Exclusiv-Partner Hallenname — Vereinsblau banner, logo on a white plate. */
export function HallenPartnerBanner({ partner }: { partner: Partner }) {
  return (
    <PartnerLink
      partner={partner}
      className={`flex flex-col gap-6 overflow-hidden rounded-2xl bg-accent-deep p-4 ${CARD_SHADOW} md:flex-row md:items-center md:gap-10 md:p-5`}
    >
      <LogoPlate
        partner={partner}
        width={720}
        height={400}
        sizes="(max-width: 768px) 100vw, 360px"
        padding="p-6"
        className="aspect-[16/9] shrink-0 overflow-hidden rounded-xl md:w-80"
      />
      <div className="flex flex-col gap-2 px-2 pb-2 md:py-2 md:pr-6">
        <h3 className="text-2xl font-black leading-tight tracking-[-0.02em] text-white md:text-3xl">
          {partner.name}
        </h3>
        {partner.description && (
          <p className="text-sm leading-relaxed text-white/80 md:text-base">
            {partner.description}
          </p>
        )}
        {partner.websiteUrl && <VisitLabel className="mt-2 text-white" />}
      </div>
    </PartnerLink>
  );
}

/** Premium — logo, name and the one-line partnership story. */
export function PremiumCard({ partner }: { partner: Partner }) {
  return (
    <PartnerLink
      partner={partner}
      className={`flex h-full flex-col overflow-hidden ${CARD_SURFACE}`}
    >
      <LogoPlate
        partner={partner}
        width={640}
        height={360}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        padding="p-6"
        className="aspect-[16/9]"
      />
      <div className="flex flex-1 flex-col gap-1 border-t border-gray-100 p-5 dark:border-gray-700">
        <h3 className="text-base font-bold leading-tight text-text dark:text-gray-100">
          {partner.name}
        </h3>
        {partner.description && (
          <p className="text-sm leading-relaxed text-muted">{partner.description}</p>
        )}
        {partner.websiteUrl && <VisitLabel className="mt-auto pt-3 text-link" />}
      </div>
    </PartnerLink>
  );
}

/** Top-, Fitness-Partner and Supporter-Club — compact logo tile. */
export function PartnerTile({ partner }: { partner: Partner }) {
  return (
    <PartnerLink
      partner={partner}
      className={`flex h-full flex-col overflow-hidden ${CARD_SURFACE}`}
    >
      <LogoPlate
        partner={partner}
        width={360}
        height={240}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        padding="p-4"
        className="aspect-[16/9]"
      />
      <p className="truncate border-t border-gray-100 px-3 py-2.5 text-center text-xs font-semibold text-muted transition-colors group-hover:text-text dark:border-gray-700 dark:group-hover:text-gray-100">
        {partner.name}
      </p>
    </PartnerLink>
  );
}
