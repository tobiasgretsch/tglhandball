import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";
import { client } from "@/lib/sanity";
import { pageHeroSlidesQuery } from "@/lib/queries";
import type { SanityImage } from "@/types";
import LegalDocument from "@/components/ui/LegalDocument";
import PageHeroSlider from "@/components/sections/PageHeroSlider";
import { IMPRESSUM_BLOCKS } from "./content";

export const metadata: Metadata = {
  alternates: { canonical: "/impressum" },
  title: "Impressum",
  description: "Impressum und rechtliche Informationen des TG MIPA Landshut.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Impressum | TG MIPA Landshut",
    description: "Impressum und rechtliche Informationen des TG MIPA Landshut.",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE.url] },
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
