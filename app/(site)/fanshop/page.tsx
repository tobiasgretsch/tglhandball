import type { Metadata } from "next";
import { client } from "@/lib/sanity";
import { pageHeroSlidesQuery } from "@/lib/queries";
import type { SanityImage } from "@/types";
import PageHeroSlider from "@/components/sections/PageHeroSlider";
import Reveal from "@/components/ui/Reveal";
import { ArrowRight } from "lucide-react";
import FanshopCategories from "./_categories";

export const metadata: Metadata = {
  title: "Fanshop",
  description:
    "Offizieller Fanshop des TG MIPA Landshut — Trikots, Shirts, Jacken, Hosen und mehr.",
  openGraph: {
    title: "Fanshop | TG MIPA Landshut",
    description: "Offizieller Fanshop des TG MIPA Landshut — zeig deine Vereinsfarben.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const revalidate = 3600;

const SHOP_BASE = "https://tengo.de/webshop/TG-Landshut-1861-eV";

export default async function FanshopPage() {
  const slides = await client
    .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
    .catch(() => [] as SanityImage[]);

  return (
    <>
      <PageHeroSlider
        slides={slides ?? []}
        title="Fanshop"
        subtitle="Trikots, Shirts, Jacken und mehr — alles mit Vereinsfarben."
      />

      <div className="bg-background dark:bg-gray-900 min-h-[60vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">

          {/* Category grid */}
          <FanshopCategories />

          {/* Full shop CTA */}
          <Reveal className="mt-8 rounded-2xl bg-primary shadow-[0_1px_2px_rgb(0_0_0/0.06),0_16px_40px_-16px_rgb(0_0_0/0.2)] px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/80 mb-1">
                Gesamter Shop
              </p>
              <p className="font-display font-bold italic uppercase text-2xl tracking-[-0.02em] text-white leading-tight">
                Alle Artikel auf einen Blick
              </p>
            </div>
            <a
              href={SHOP_BASE}
              target="_blank"
              rel="noopener noreferrer"
              className="btn press bg-white !text-primary hover:bg-white/90 shrink-0 whitespace-nowrap"
            >
              Zum Fanshop
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </Reveal>

        </div>
      </div>
    </>
  );
}
