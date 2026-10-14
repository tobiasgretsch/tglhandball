import type { Metadata } from "next";
import { client } from "@/lib/sanity";
import { pageHeroSlidesQuery } from "@/lib/queries";
import type { SanityImage } from "@/types";
import LegalDocument from "@/components/ui/LegalDocument";
import PageHeroSlider from "@/components/sections/PageHeroSlider";
import { IMPRESSUM_BLOCKS } from "./content";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum und rechtliche Informationen des TG MIPA Landshut.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Impressum | TG MIPA Landshut",
    description: "Impressum und rechtliche Informationen des TG MIPA Landshut.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function ImpressumPage() {
  const slides = await client
    .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
    .catch(() => [] as SanityImage[]);

  return (
    <>
      <PageHeroSlider slides={slides ?? []} title="Impressum" subtitle="Rechtliche Angaben des TG MIPA Landshut." />
      <LegalDocument blocks={IMPRESSUM_BLOCKS} />
    </>
  );
}
