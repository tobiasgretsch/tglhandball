import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";
import Image from "next/image";
import { Mail } from "lucide-react";
import { client, urlFor } from "@/lib/sanity";
import { clubGalleryQuery, settingsQuery } from "@/lib/queries";
import { CLUB_GALLERY_FILTER } from "@/lib/gallery";
import type { ClubLocation, GalleryItem, Settings } from "@/types";
import PortableText from "@/components/ui/PortableText";
import Reveal from "@/components/ui/Reveal";
import AnfahrtSection from "@/components/sections/AnfahrtSection";
import PageHeroSlider from "@/components/sections/PageHeroSlider";
import GalleryRow from "@/components/sections/GalleryRow";

export const metadata: Metadata = {
  alternates: { canonical: "/ueberuns" },
  title: "Über uns",
  description:
    "Geschichte, Vorstand, Ansprechpartner und Kontakt des TG MIPA Landshut.",
  openGraph: {
    title: "Über uns | TG MIPA Landshut",
    description: "Geschichte, Vorstand, Ansprechpartner und Kontakt des TG MIPA Landshut.",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE.url] },
};

export const revalidate = 3600;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function UeberUnsPage() {
  const [settings, clubPhotos] = await Promise.all([
    client
      .fetch<Settings>(settingsQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => null),
    client
      .fetch<Pick<GalleryItem, "_id" | "image" | "caption">[]>(
        clubGalleryQuery,
        {},
        { next: { revalidate: 3600 } }
      )
      .catch(() => []),
  ]);

  const locations = buildLocations(settings);

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <PageHeroSlider
        slides={settings?.pageHeroSlides ?? []}
        title="Über uns"
        subtitle="Geschichte, Menschen und Werte des TG MIPA Landshut."
      />

      <div className="bg-background dark:bg-gray-900">

        {/* ── Section 1: Club history ──────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <Reveal><SectionHeading label="Vereinsgeschichte" /></Reveal>

          <div className="mt-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Text */}
            <div>
              {settings?.aboutText && settings.aboutText.length > 0 ? (
                <PortableText value={settings.aboutText} />
              ) : (
                <p className="text-muted text-sm">
                  Noch kein Text hinterlegt. Bitte den Text im CMS unter{" "}
                  <em>Einstellungen → Vereinsgeschichte</em> pflegen.
                </p>
              )}
            </div>

            {/* Photo */}
            {settings?.aboutPhoto && (
              <div className="lg:sticky lg:top-[88px]">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-[0_1px_2px_rgb(0_0_0/0.06),0_16px_40px_-16px_rgb(0_0_0/0.2)]">
                  <Image
                    src={urlFor(settings.aboutPhoto).width(900).height(675).url()}
                    alt="TG MIPA Landshut"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  {/* Subtle bottom gradient */}
                  <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              </div>
            )}
          </div>
        </section>

        <Divider />

        {/* ── Section 2: Board & contact persons ──────────────────────── */}
        {settings?.boardMembers && settings.boardMembers.length > 0 && (
          <>
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
              <Reveal><SectionHeading label="Vorstand & Ansprechpartner" /></Reveal>

              <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {settings.boardMembers.map((member) => {
                  const photoUrl = member.photo
                    ? urlFor(member.photo).width(200).height(200).url()
                    : null;

                  return (
                    <Reveal key={member._key}>
                    <div
                      className="h-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_16px_40px_-16px_rgb(0_0_0/0.2)] p-5 flex flex-col items-center text-center gap-3"
                    >
                      {/* Avatar */}
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-accent/10 to-primary/10 shrink-0 flex items-center justify-center">
                        {photoUrl ? (
                          <Image
                            src={photoUrl}
                            alt={member.name}
                            width={80}
                            height={80}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="text-2xl font-black text-accent/30 uppercase select-none">
                            {member.name.charAt(0)}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <p className="font-black text-text dark:text-gray-100 text-sm leading-tight">
                          {member.name}
                        </p>
                        {member.role && (
                          <p className="text-xs text-muted mt-0.5 leading-snug">
                            {member.role}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary dark:text-primary-glow hover:text-primary-light transition-colors truncate max-w-full"
                        >
                          <Mail size={12} className="shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </a>
                      )}
                    </div>
                    </Reveal>
                  );
                })}
              </div>
            </section>

            <Divider />
          </>
        )}

        {/* ── Section 3: Anfahrt (game hall + training locations) ──────── */}
        {locations.length > 0 && (
          <section id="anfahrt" className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
            <Reveal><SectionHeading label="Anfahrt" /></Reveal>
            <AnfahrtSection locations={locations} />
          </section>
        )}

        {locations.length > 0 && clubPhotos.length > 0 && <Divider />}

        {/* ── Section 4: Verein gallery ────────────────────────────────── */}
        <GalleryRow
          photos={clubPhotos}
          filter={CLUB_GALLERY_FILTER}
          className="bg-background dark:bg-gray-900"
        />

      </div>
    </>
  );
}

/** The legacy "Spielhalle" settings fields come first, followed by the CMS-managed locations. */
function buildLocations(settings: Settings | null): ClubLocation[] {
  if (!settings) return [];
  const gameHall: ClubLocation[] = settings.venueName || settings.venueAddress
    ? [{
        _key: "spielhalle",
        name: settings.venueName ?? "Spielhalle",
        label: "Spielhalle",
        address: settings.venueAddress,
        lat: settings.venueLat,
        lng: settings.venueLng,
      }]
    : [];
  return [...gameHall, ...(settings.locations ?? [])];
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionHeading({ label }: { label: string }) {
  return (
    <h2 className="font-display font-bold italic uppercase text-4xl md:text-5xl tracking-[-0.02em] text-text dark:text-gray-100">
      {label}
    </h2>
  );
}

function Divider() {
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><hr className="border-gray-100 dark:border-gray-800" /></div>;
}
