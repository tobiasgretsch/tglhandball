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
      <PageHeroSlider
        slides={slides ?? []}
        title="Impressionen"
        subtitle="Fotos und Eindrücke von Spielen, Training und Events."
      />

      <GalleryClient items={items} />
    </>
  );
}
