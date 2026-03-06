import type { Metadata } from "next";
import { client } from "@/lib/sanity";
import { allMagazinesQuery, pageHeroSlidesQuery } from "@/lib/queries";
import type { Magazine, SanityImage } from "@/types";
import MagazineClient from "@/components/sections/MagazineClient";
import PageHeroSlider from "@/components/sections/PageHeroSlider";

export const metadata: Metadata = {
  title: "Spieltagsmagazine",
  description:
    "Alle Spieltagsmagazine der TG MIPA Landshut zum Download – sortiert nach Saison.",
  openGraph: {
    title: "Spieltagsmagazine | TG MIPA Landshut",
    description: "Alle Spieltagsmagazine der TG MIPA Landshut zum Download – sortiert nach Saison.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const revalidate = 300;

export default async function SpieltagsmagazinPage() {
  const [magazines, slides] = await Promise.all([
    client
      .fetch<Magazine[]>(allMagazinesQuery, {}, { next: { revalidate: 300 } })
      .catch(() => [] as Magazine[]),
    client
      .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as SanityImage[]),
  ]);

  return (
    <>
      <PageHeroSlider slides={slides ?? []}>
        <span className="absolute right-6 bottom-0 text-[120px] md:text-[200px] font-black text-white/5 leading-none select-none pointer-events-none">
          MAGAZINE
        </span>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-[132px] lg:pt-[140px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/50 mb-3">
            TG MIPA Landshut
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight">
            Spieltagsmagazine
          </h1>
          <p className="text-white/55 mt-3 text-base max-w-lg">
            Alle Spieltagsmagazine der TG MIPA Landshut zum Download.
          </p>
        </div>
      </PageHeroSlider>

      <MagazineClient magazines={magazines} />
    </>
  );
}
