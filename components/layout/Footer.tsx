import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Youtube, Mail, MapPin } from "lucide-react";
import PartnerBanner from "@/components/sections/PremiumPartnerBanner";

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.55V6.79a4.85 4.85 0 0 1-1.07-.1z" />
    </svg>
  );
}
import { client, urlFor } from "@/lib/sanity";
import { settingsQuery, premiumPartnersQuery, standardPartnersQuery } from "@/lib/queries";
import type { Settings, Partner } from "@/types";

const QUICK_LINKS = [
  { label: "News", href: "/news" },
  { label: "Teams", href: "/teams" },
  { label: "Spielplan", href: "/spielplan" },
  { label: "Verein", href: "/verein" },
  { label: "Kontakt", href: "/kontakt" },
];

export default async function Footer() {
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

      {/* Premium partner strip */}
      {premiumPartners && premiumPartners.length > 0 && (
        <div className="relative border-b border-white/10 bg-black/25 dark:bg-black/40">
          {/* Gold shimmer lines */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Section heading with decorative rule */}
            <div className="flex items-center gap-4 mb-7">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-400/35" />
              <div className="flex items-center gap-2.5">
                <span className="text-amber-400/70 text-[9px] leading-none">★</span>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-400/80">
                  Premium Partner
                </p>
                <span className="text-amber-400/70 text-[9px] leading-none">★</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-400/35" />
            </div>

            {/* Auto-rotating partner banner */}
            <PartnerBanner
              variant="premium"
              partners={premiumPartners.map((p) => ({
                _id: p._id,
                name: p.name,
                logoUrl: p.logo ? urlFor(p.logo).width(440).height(248).fit("max").url() : null,
                websiteUrl: p.websiteUrl,
              }))}
            />

            {/* Link to partner page */}
            <div className="flex justify-center mt-6">
              <Link
                href="/partner"
                className="inline-flex items-center gap-2 border border-amber-400/40 text-amber-400/80 hover:text-amber-400 hover:border-amber-400/70 hover:bg-amber-400/5 text-[12px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-sm transition-all duration-200"
              >
                Alle Partner ansehen →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Standard partner strip */}
      {standardPartners && standardPartners.length > 0 && (
        <div className="relative border-b border-white/10 bg-black/15 dark:bg-black/25">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Section heading */}
            <div className="flex items-center gap-4 mb-5">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/15" />
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">
                Partner
              </p>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/15" />
            </div>

            {/* Auto-rotating standard partner banner */}
            <PartnerBanner
              variant="standard"
              partners={standardPartners.map((p) => ({
                _id: p._id,
                name: p.name,
                logoUrl: p.logo ? urlFor(p.logo).width(256).height(144).fit("max").url() : null,
                websiteUrl: p.websiteUrl,
              }))}
            />
          </div>
        </div>
      )}

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
                <span className="text-white/55 font-bold">MIPA</span>
              </span>
            </div>
            <p className="text-white/55 text-sm leading-relaxed mb-6 max-w-[240px]">
              Handball in Landshut — Leidenschaft, Teamgeist und Sport auf
              höchstem Niveau.
            </p>
            <div className="flex gap-2">
              {settings?.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-sm bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
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
                  className="w-9 h-9 rounded-sm bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
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
                  className="w-9 h-9 rounded-sm bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                >
                  <Youtube size={16} />
                </a>
              )}
              {settings?.tiktokUrl && (
                <a
                  href={settings.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="w-9 h-9 rounded-sm bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                >
                  <TikTokIcon size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45 mb-5">
              Schnelllinks
            </h3>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/65 hover:text-white text-sm font-medium transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45 mb-5">
              Kontakt
            </h3>
            <div className="space-y-3">
              {settings?.contactEmail && (
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="flex items-center gap-2.5 text-white/65 hover:text-white text-sm transition-colors"
                >
                  <Mail size={14} className="shrink-0" />
                  {settings.contactEmail}
                </a>
              )}
              {settings?.venueAddress && (
                <div className="flex items-start gap-2.5 text-white/65 text-sm">
                  <MapPin size={14} className="shrink-0 mt-0.5" />
                  <span>{settings.venueAddress}</span>
                </div>
              )}
              {!settings?.contactEmail && !settings?.venueAddress && (
                <p className="text-white/35 text-sm">
                  Kontaktdaten werden im CMS konfiguriert.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/35 text-xs">
            © {year} TG MIPA Landshut
          </p>
          <div className="flex gap-5">
            <Link
              href="/impressum"
              className="text-white/35 hover:text-white/65 text-xs transition-colors"
            >
              Impressum
            </Link>
            <Link
              href="/datenschutz"
              className="text-white/35 hover:text-white/65 text-xs transition-colors"
            >
              Datenschutz
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
