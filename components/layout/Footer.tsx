import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Instagram, Facebook, Youtube, Mail, MapPin } from "lucide-react";
import CookieSettingsButton from "@/components/ui/CookieSettingsButton";
import PartnerBand, { type PartnerBandItem } from "@/components/sections/PartnerBand";
import { client, urlFor } from "@/lib/sanity";
import { settingsQuery, premiumPartnersQuery, standardPartnersQuery } from "@/lib/queries";
import type { Settings, Partner } from "@/types";

const QUICK_LINKS = [
  { key: "news", href: "/news" },
  { key: "teams", href: "/teams" },
  { key: "live", href: "/live" },
  { key: "partner", href: "/partner" },
  { key: "fanshop", href: "/fanshop" },
  { key: "club", href: "/ueberuns" },
] as const;

const PARTNER_LOGO_WIDTH = 352; // 2x the 176px premium logo box, sharp on retina
const PARTNER_LOGO_HEIGHT = 128;

function toBandItem(p: Partner): PartnerBandItem {
  return {
    _id: p._id,
    name: p.name,
    logoUrl: p.logo
      ? urlFor(p.logo).width(PARTNER_LOGO_WIDTH).height(PARTNER_LOGO_HEIGHT).fit("max").url()
      : null,
    websiteUrl: p.websiteUrl,
  };
}

export default async function Footer() {
  const t = await getTranslations("footer");
  const [settings, premiumPartners, standardPartners] = await Promise.all([
    client
      .fetch<Settings>(settingsQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => null),
    client
      .fetch<Partner[]>(premiumPartnersQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as Partner[]),
    client
      .fetch<Partner[]>(standardPartnersQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as Partner[]),
  ]);

  const year = new Date().getFullYear();
  const logoUrl = settings?.logo
    ? urlFor(settings.logo).width(96).height(96).url()
    : null;

  const logoWatermarkUrl = settings?.logo
    ? urlFor(settings.logo).width(600).height(600).url()
    : null;

  return (
    <footer className="relative bg-primary dark:bg-gray-900 overflow-hidden">
      {/* Centred logo watermark */}
      {logoWatermarkUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image
            src={logoWatermarkUrl}
            alt=""
            width={480}
            height={480}
            className="object-contain opacity-[0.06] brightness-0 invert select-none"
            aria-hidden
          />
        </div>
      )}

      <PartnerBand
        premium={premiumPartners.map(toBandItem)}
        standard={standardPartners.map(toBandItem)}
      />

      {/* Main footer grid */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand + social */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {logoUrl && (
                <Image
                  src={logoUrl}
                  alt={settings?.clubName ?? "TG MIPA"}
                  width={48}
                  height={48}
                  className="object-contain brightness-0 invert"
                />
              )}
              <span className="font-black text-white text-xl uppercase tracking-tight leading-none">
                TG{" "}
                <span className="text-white/95 font-bold">MIPA</span>
              </span>
            </div>
            <p className="text-white/95 text-sm leading-relaxed mb-6 max-w-[240px]">
              {t("tagline")}
            </p>
            <div className="flex gap-2">
              {settings?.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white press"
                >
                  <Instagram size={16} />
                </a>
              )}
              {settings?.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white press"
                >
                  <Facebook size={16} />
                </a>
              )}
              {settings?.youtubeUrl && (
                <a
                  href={settings.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white press"
                >
                  <Youtube size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-white/95 mb-5">
              {t("quickLinks")}
            </h3>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/95 hover:text-white text-sm font-medium transition-colors"
                  >
                    {t(`links.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-white/95 mb-5">
              {t("contact")}
            </h3>
            <div className="space-y-3">
              {settings?.contactEmail && (
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="flex items-center gap-2.5 text-white/95 hover:text-white text-sm transition-colors"
                >
                  <Mail size={14} className="shrink-0" />
                  {settings.contactEmail}
                </a>
              )}
              {settings?.venueAddress && (
                <div className="flex items-start gap-2.5 text-white/95 text-sm">
                  <MapPin size={14} className="shrink-0 mt-0.5" />
                  <span>{settings.venueAddress}</span>
                </div>
              )}
              {!settings?.contactEmail && !settings?.venueAddress && (
                <p className="text-white/95 text-sm">
                  {t("contactMissing")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/95 text-xs">
            {t("copyright", { year })}
          </p>
          <div className="flex gap-5">
            <Link
              href="/impressum"
              className="text-white/95 hover:text-white text-xs transition-colors"
            >
              {t("imprint")}
            </Link>
            <Link
              href="/datenschutz"
              className="text-white/95 hover:text-white text-xs transition-colors"
            >
              {t("privacy")}
            </Link>
            <CookieSettingsButton className="text-white/95 hover:text-white text-xs transition-colors" />
          </div>
        </div>
      </div>
    </footer>
  );
}
