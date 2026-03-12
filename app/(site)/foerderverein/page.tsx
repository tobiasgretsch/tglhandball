import type { Metadata } from "next";
import { client } from "@/lib/sanity";
import { pageHeroSlidesQuery } from "@/lib/queries";
import type { SanityImage } from "@/types";
import PageHeroSlider from "@/components/sections/PageHeroSlider";
import { Users, Heart, Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "Förderverein",
  description:
    "Der Förderverein des TG MIPA Landshut – gemeinsam für den Handball in Landshut.",
  openGraph: {
    title: "Förderverein | TG MIPA Landshut",
    description:
      "Der Förderverein des TG MIPA Landshut – gemeinsam für den Handball in Landshut.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const revalidate = 3600;

export default async function FoerdervereinPage() {
  const slides = await client
    .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
    .catch(() => [] as SanityImage[]);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <PageHeroSlider slides={slides ?? []}>
        <span className="absolute right-6 bottom-0 text-[120px] md:text-[200px] font-black text-white/5 leading-none select-none pointer-events-none">
          FÖRDERVEREIN
        </span>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-[132px] lg:pt-[140px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/50 mb-3">
            TG MIPA Landshut
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight">
            Förderverein
          </h1>
          <p className="text-white/55 mt-3 text-base max-w-lg">
            Gemeinsam stark – für den Handball in Landshut.
          </p>
        </div>
      </PageHeroSlider>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="bg-background dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">

          {/* Intro */}
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-text dark:text-white uppercase tracking-tight mb-4">
              Werde Teil des Fördervereins
            </h2>
            <p className="text-muted text-base max-w-2xl mx-auto leading-relaxed">
              Der Förderverein des TG MIPA Landshut unterstützt unsere Mannschaften
              und ermöglicht Kindern und Jugendlichen die Ausübung des Handballs.
              Jede Mitgliedschaft hilft, den Sport in unserer Stadt lebendig zu halten.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-14">
            <FeatureCard
              icon={<Users size={28} />}
              title="Gemeinschaft"
              text="Als Mitglied des Fördervereins bist du Teil einer starken Gemeinschaft, die den Handball in Landshut unterstützt."
            />
            <FeatureCard
              icon={<Heart size={28} />}
              title="Unterstützung"
              text="Deine Mitgliedschaft ermöglicht Nachwuchsspielerinnen und -spielern die Teilnahme am Vereinssport."
            />
            <FeatureCard
              icon={<Trophy size={28} />}
              title="Erfolg"
              text="Gemeinsam fördern wir Spitzenleistungen und stärken den Handballstandort Landshut nachhaltig."
            />
          </div>

          {/* Contact CTA */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 md:p-10 text-center">
            <h3 className="text-xl font-black text-text dark:text-white uppercase tracking-tight mb-3">
              Interesse? Wir freuen uns auf dich!
            </h3>
            <p className="text-muted text-sm mb-6 max-w-md mx-auto">
              Für Informationen zur Mitgliedschaft im Förderverein nimm gerne Kontakt mit uns auf.
            </p>
            <a
              href="/ueberuns#kontakt"
              className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm uppercase tracking-widest px-7 py-3 rounded-lg hover:bg-primary-light transition-colors"
            >
              Kontakt aufnehmen
            </a>
          </div>

        </div>
      </div>
    </>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <h3 className="font-black text-text dark:text-white text-lg tracking-tight">
        {title}
      </h3>
      <p className="text-muted text-sm leading-relaxed">{text}</p>
    </div>
  );
}
