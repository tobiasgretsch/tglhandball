import type { Metadata } from "next";
import { client } from "@/lib/sanity";
import { allGalleryQuery, pageHeroSlidesQuery } from "@/lib/queries";
import type { GalleryItem, SanityImage } from "@/types";
import GalleryClient from "@/components/sections/GalleryClient";
import PageHeroSlider from "@/components/sections/PageHeroSlider";

export const metadata: Metadata = {
  title: "Impressionen",
  description:
    "Fotos und Eindrücke von Spielen, Training und Events des TG MIPA Landshut.",
  openGraph: {
    title: "Impressionen | TG MIPA Landshut",
    description: "Fotos und Eindrücke von Spielen, Training und Events des TG MIPA Landshut.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const revalidate = 3600;

export default async function ImpressionsPage() {
  const [items, slides] = await Promise.all([
    client
      .fetch<GalleryItem[]>(allGalleryQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as GalleryItem[]),
    client
      .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as SanityImage[]),
  ]);

  return (
    <>
      <PageHeroSlider slides={slides ?? []}>
        <span className="absolute right-6 bottom-0 text-[120px] md:text-[200px] font-black text-white/5 leading-none select-none pointer-events-none">
          FOTOS
        </span>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-[132px] lg:pt-[140px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/50 mb-3">
            TG MIPA Landshut
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight">
            Impressionen
          </h1>
          <p className="text-white/55 mt-3 text-base max-w-lg">
            Fotos und Eindrücke von Spielen, Training und Events.
          </p>
        </div>
      </PageHeroSlider>

      <GalleryClient items={items} />
    </>
  );
}
