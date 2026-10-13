import type { Metadata } from "next";
import { client } from "@/lib/sanity";
import { pageHeroSlidesQuery } from "@/lib/queries";
import type { SanityImage } from "@/types";
import PageHeroSlider from "@/components/sections/PageHeroSlider";
import Reveal from "@/components/ui/Reveal";
import FoerdervereinForm from "@/components/sections/FoerdervereinForm";
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
      <PageHeroSlider
        slides={slides ?? []}
        title="Förderverein"
        subtitle="Gemeinsam stark – für den Handball in Landshut."
      />

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="bg-background dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">

          {/* Intro */}
          <Reveal className="text-center mb-14">
            <h2 className="font-display font-bold italic uppercase text-4xl md:text-5xl tracking-[-0.02em] text-text dark:text-gray-100 mb-4 text-balance">
              Werde Teil des Fördervereins
            </h2>
            <p className="text-muted dark:text-gray-400 text-base max-w-2xl mx-auto leading-relaxed">
              Der Förderverein des TG MIPA Landshut unterstützt unsere Mannschaften
              und ermöglicht Kindern und Jugendlichen die Ausübung des Handballs.
              Jede Mitgliedschaft hilft, den Sport in unserer Stadt lebendig zu halten.
            </p>
          </Reveal>

          {/* Feature grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-14">
            <FeatureCard
              delay={0}
              icon={<Users size={28} />}
              title="Gemeinschaft"
              text="Als Mitglied des Fördervereins bist du Teil einer starken Gemeinschaft, die den Handball in Landshut unterstützt."
            />
            <FeatureCard
              delay={0.08}
              icon={<Heart size={28} />}
              title="Unterstützung"
              text="Deine Mitgliedschaft ermöglicht Nachwuchsspielerinnen und -spielern die Teilnahme am Vereinssport."
            />
            <FeatureCard
              delay={0.16}
              icon={<Trophy size={28} />}
              title="Erfolg"
              text="Gemeinsam fördern wir Spitzenleistungen und stärken den Handballstandort Landshut nachhaltig."
            />
          </div>

          {/* Membership signup */}
          <div id="mitglied-werden" className="scroll-mt-24">
          <Reveal
            className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 sm:p-8 md:p-10 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_16px_40px_-16px_rgb(0_0_0/0.2)]"
          >
            <div className="text-center mb-10">
              <h3 className="font-display font-bold italic uppercase text-2xl md:text-3xl tracking-[-0.02em] text-text dark:text-gray-100 mb-3">
                Jetzt Mitglied werden
              </h3>
              <p className="text-muted dark:text-gray-400 text-sm max-w-md mx-auto">
                Fülle das Formular aus und erteile uns ein SEPA-Lastschriftmandat für den Jahresbeitrag.
              </p>
            </div>
            <FoerdervereinForm />
          </Reveal>
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
  delay,
}: {
  delay: number;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Reveal delay={delay}>
      <div className="h-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_16px_40px_-16px_rgb(0_0_0/0.2)] p-6 flex flex-col gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary dark:text-primary-glow">
          {icon}
        </div>
        <h3 className="font-bold text-text dark:text-gray-100 text-lg tracking-[-0.01em]">
          {title}
        </h3>
        <p className="text-muted dark:text-gray-400 text-sm leading-relaxed">{text}</p>
      </div>
    </Reveal>
  );
}
