import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DEFAULT_OG_IMAGE, localizedAlternates } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import { client } from "@/lib/sanity";
import { allNewsQuery, pageHeroSlidesQuery } from "@/lib/queries";
import type { NewsArticle, SanityImage } from "@/types";
import NewsClient from "@/components/sections/NewsClient";
import PageHeroSlider from "@/components/sections/PageHeroSlider";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "newsPage" });
  return {
    alternates: localizedAlternates("/news", locale),
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("ogTitle"),
      description: t("metaDescription"),
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE.url] },
  };
}

export const revalidate = 1800;

export default async function NewsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("newsPage");
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
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
      />

      <NewsClient articles={articles} />
    </>
  );
}
