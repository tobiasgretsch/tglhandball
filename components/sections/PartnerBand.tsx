import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export interface PartnerBandItem {
  _id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl?: string;
}

interface Props {
  premium: PartnerBandItem[];
  standard: PartnerBandItem[];
}

type Tier = "premium" | "standard";

// Standard partners scroll only when they would not fit on one or two static rows.
const MARQUEE_MIN_PARTNERS = 7;

const LOGO_BOX: Record<Tier, string> = {
  premium: "h-12 w-32 sm:h-16 sm:w-44",
  standard: "h-10 w-28",
};

function PartnerLogo({ partner, tier, visitLabel }: { partner: PartnerBandItem; tier: Tier; visitLabel: string }) {
  const content = partner.logoUrl ? (
    <span className={`partner-logo relative block ${LOGO_BOX[tier]}`}>
      <Image
        src={partner.logoUrl}
        alt={partner.name}
        fill
        sizes={tier === "premium" ? "176px" : "112px"}
        draggable={false}
        className="object-contain"
      />
    </span>
  ) : (
    <span
      className={`partner-logo flex items-center justify-center text-center font-semibold text-gray-500 dark:text-gray-400 ${LOGO_BOX[tier]} ${
        tier === "premium" ? "text-sm sm:text-base" : "text-xs"
      }`}
    >
      {partner.name}
    </span>
  );

  if (!partner.websiteUrl) return content;

  return (
    <a
      href={partner.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={visitLabel}
      className="partner-link block rounded-lg"
    >
      {content}
    </a>
  );
}

interface RowProps {
  partners: PartnerBandItem[];
  tier: Tier;
  visitLabel: (name: string) => string;
}

function StaticRow({ partners, tier, visitLabel }: RowProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-center ${
        tier === "premium" ? "gap-x-8 gap-y-6 sm:gap-x-14 sm:gap-y-8" : "gap-x-10 gap-y-6"
      }`}
    >
      {partners.map((p) => (
        <PartnerLogo key={p._id} partner={p} tier={tier} visitLabel={visitLabel(p.name)} />
      ))}
    </div>
  );
}

function MarqueeRow({ partners, tier, visitLabel }: RowProps) {
  return (
    <div className="partner-marquee">
      <div className="partner-marquee-track">
        {[0, 1].map((copy) =>
          partners.map((p) => (
            <div key={`${copy}-${p._id}`} className="px-5" aria-hidden={copy === 1 || undefined}>
              <PartnerLogo partner={p} tier={tier} visitLabel={visitLabel(p.name)} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default async function PartnerBand({ premium, standard }: Props) {
  if (premium.length === 0 && standard.length === 0) return null;
  const t = await getTranslations("partnerBand");
  const visitLabel = (name: string) => t("visit", { name });

  return (
    <section aria-labelledby="partner-heading" className="border-b border-transparent bg-white dark:border-white/10 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2
          id="partner-heading"
          className="mb-10 text-center text-sm font-semibold text-gray-600 dark:text-gray-300"
        >
          {t("heading")}
        </h2>

        {premium.length > 0 && <StaticRow partners={premium} tier="premium" visitLabel={visitLabel} />}

        {premium.length > 0 && standard.length > 0 && (
          <div className="mx-auto my-10 h-px max-w-xs bg-gray-200 dark:bg-white/10" />
        )}

        {standard.length > 0 &&
          (standard.length >= MARQUEE_MIN_PARTNERS ? (
            <MarqueeRow partners={standard} tier="standard" visitLabel={visitLabel} />
          ) : (
            <StaticRow partners={standard} tier="standard" visitLabel={visitLabel} />
          ))}

        <div className="mt-10 flex justify-center">
          <Link
            href="/partner"
            className="press text-sm font-semibold text-accent hover:underline dark:text-accent-sky"
          >
            {t("all")}
          </Link>
        </div>
      </div>
    </section>
  );
}
