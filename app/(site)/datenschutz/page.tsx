import type { Metadata } from "next";
import { client } from "@/lib/sanity";
import { pageHeroSlidesQuery } from "@/lib/queries";
import type { SanityImage } from "@/types";
import LegalDocument from "@/components/ui/LegalDocument";
import PageHeroSlider from "@/components/sections/PageHeroSlider";
import { DATENSCHUTZ_BLOCKS } from "./content";

export const metadata: Metadata = {
  title: "Datenschutz",
  description: "Datenschutzerklärung und Informationen zur Datenverarbeitung des TG MIPA Landshut.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Datenschutz | TG MIPA Landshut",
    description: "Datenschutzerklärung und Informationen zur Datenverarbeitung des TG MIPA Landshut.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function DatenschutzPage() {
  const slides = await client
    .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
    .catch(() => [] as SanityImage[]);

  return (
    <>
      <PageHeroSlider slides={slides ?? []} title="Datenschutz" subtitle="Wie wir mit deinen Daten umgehen." />
      <LegalDocument blocks={DATENSCHUTZ_BLOCKS} />
    </>
  );
}
