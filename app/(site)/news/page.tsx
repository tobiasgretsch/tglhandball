import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";
import { client } from "@/lib/sanity";
import { allNewsQuery, pageHeroSlidesQuery } from "@/lib/queries";
import type { NewsArticle, SanityImage } from "@/types";
import NewsClient from "@/components/sections/NewsClient";
import PageHeroSlider from "@/components/sections/PageHeroSlider";

export const metadata: Metadata = {
  alternates: { canonical: "/news" },
  title: "Neuigkeiten",
  description:
    "Aktuelle Nachrichten, Spielberichte und Vereinsnews von TG MIPA Landshut.",
  openGraph: {
    title: "Neuigkeiten | TG MIPA Landshut",
    description: "Aktuelle Nachrichten, Spielberichte und Vereinsnews von TG MIPA Landshut.",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE.url] },
};

export const revalidate = 1800;

export default async function NewsPage() {
  const [articles, slides] = await Promise.all([
    client
      .fetch<NewsArticle[]>(allNewsQuery, {}, { next: { revalidate: 1800 } })
      .catch(() => [] as NewsArticle[]),
    client
      .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as SanityImage[]),
  ]);

  return (
    <>
      <PageHeroSlider
        slides={slides ?? []}
        title="Neuigkeiten"
        subtitle="Spielberichte, Vereinsnews und alles rund um TG MIPA Landshut."
      />

      <NewsClient articles={articles} />
    </>
  );
}
