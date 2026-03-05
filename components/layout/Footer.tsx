import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Youtube, Mail, MapPin } from "lucide-react";
import { client, urlFor } from "@/lib/sanity";
import { settingsQuery, premiumPartnersQuery } from "@/lib/queries";
import type { Settings, Partner } from "@/types";

const QUICK_LINKS = [
  { label: "News", href: "/news" },
  { label: "Teams", href: "/teams" },
  { label: "Spielplan", href: "/spielplan" },
  { label: "Verein", href: "/verein" },
  { label: "Kontakt", href: "/kontakt" },
];

export default async function Footer() {
  const [settings, partners] = await Promise.all([
    client
      .fetch<Settings>(settingsQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => null),
    client
      .fetch<Partner[]>(premiumPartnersQuery, {}, { next: { revalidate: 3600 } })
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
    <footer className="relative bg-primary overflow-hidden">
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
      {partners && partners.length > 0 && (
        <div className="relative border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45 mb-4">
              Unsere Premium-Partner
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              {partners.map((partner) => {
                const inner = (
                  <>
                    {partner.logo ? (
                      <Image
                        src={urlFor(partner.logo).width(80).height(28).url()}
                        alt={partner.name}
                        width={80}
                        height={28}
                        className="object-contain brightness-0 invert opacity-85"
                      />
                    ) : (
                      <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">
                        {partner.name}
                      </span>
                    )}
                  </>
                );

                return partner.websiteUrl ? (
                  <a
                    key={partner._id}
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center bg-white/15 hover:bg-white/25 rounded-sm px-4 py-2.5 transition-colors"
                  >
                    {inner}
                  </a>
                ) : (
                  <div
                    key={partner._id}
                    className="flex items-center bg-white/10 rounded-sm px-4 py-2.5"
                  >
                    {inner}
                  </div>
                );
              })}
            </div>
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
