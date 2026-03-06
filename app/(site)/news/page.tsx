import type { Metadata } from "next";
import { client } from "@/lib/sanity";
import { allNewsQuery, pageHeroSlidesQuery } from "@/lib/queries";
import type { NewsArticle, SanityImage } from "@/types";
import NewsClient from "@/components/sections/NewsClient";
import PageHeroSlider from "@/components/sections/PageHeroSlider";

export const metadata: Metadata = {
  title: "Neuigkeiten",
  description:
    "Aktuelle Nachrichten, Spielberichte und Vereinsnews von TG MIPA Landshut.",
  openGraph: {
    title: "Neuigkeiten | TG MIPA Landshut",
    description: "Aktuelle Nachrichten, Spielberichte und Vereinsnews von TG MIPA Landshut.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
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
      <PageHeroSlider slides={slides ?? []}>
        <span className="absolute right-6 bottom-0 text-[120px] md:text-[200px] font-black text-white/5 leading-none select-none pointer-events-none">
          NEWS
        </span>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-[132px] lg:pt-[140px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/50 mb-3">
            TG MIPA Landshut
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight">
            Neuigkeiten
          </h1>
          <p className="text-white/55 mt-3 text-base max-w-lg">
            Spielberichte, Vereinsnews und alles rund um TG MIPA Landshut.
          </p>
        </div>
      </PageHeroSlider>

      <NewsClient articles={articles} />
    </>
  );
}
