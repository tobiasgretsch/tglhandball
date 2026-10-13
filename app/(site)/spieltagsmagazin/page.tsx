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
      <PageHeroSlider
        slides={slides ?? []}
        title="Spieltagsmagazine"
        subtitle="Alle Spieltagsmagazine der TG MIPA Landshut zum Download."
      />

      <MagazineClient magazines={magazines} />
    </>
  );
}
