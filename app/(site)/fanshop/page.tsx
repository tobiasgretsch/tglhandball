import type { Metadata } from "next";
import { client } from "@/lib/sanity";
import { pageHeroSlidesQuery } from "@/lib/queries";
import type { SanityImage } from "@/types";
import PageHeroSlider from "@/components/sections/PageHeroSlider";
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
      <PageHeroSlider slides={slides ?? []}>
        <span className="absolute right-6 bottom-0 text-[120px] md:text-[200px] font-black text-white/5 leading-none select-none pointer-events-none">
          SHOP
        </span>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-[132px] lg:pt-[140px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/50 mb-3">
            TG MIPA Landshut
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight">
            Fanshop
          </h1>
          <p className="text-white/55 mt-3 text-base max-w-lg">
            Trikots, Shirts, Jacken und mehr — alles mit Vereinsfarben.
          </p>
        </div>
      </PageHeroSlider>

      <div className="bg-background dark:bg-gray-900 min-h-[60vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">

          {/* Category grid */}
          <FanshopCategories />

          {/* Full shop CTA */}
          <div className="mt-8 rounded-xl bg-primary px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60 mb-1">
                Gesamter Shop
              </p>
              <p className="font-black text-white text-base leading-tight">
                Alle Artikel auf einen Blick
              </p>
            </div>
            <a
              href={SHOP_BASE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary font-bold uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:bg-white/90 transition-colors shrink-0 whitespace-nowrap"
            >
              Zum Fanshop
              <ArrowRight size={13} />
            </a>
          </div>

        </div>
      </div>
    </>
  );
}
