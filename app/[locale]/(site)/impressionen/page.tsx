import { Suspense } from "react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { DEFAULT_OG_IMAGE, localizedAlternates } from "@/lib/seo";
import { routing } from "@/i18n/routing";
import { client } from "@/lib/sanity";
import { allGalleryQuery, pageHeroSlidesQuery } from "@/lib/queries";
import type { GalleryItem, SanityImage } from "@/types";
import GalleryClient from "@/components/sections/GalleryClient";
import PageHeroSlider from "@/components/sections/PageHeroSlider";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "gallery" });
  return {
    alternates: localizedAlternates("/impressionen", locale),
    title: t("meta.title"),
    description: t("meta.description"),
    openGraph: {
      title: `${t("meta.title")} | TG MIPA Landshut`,
      description: t("meta.description"),
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE.url] },
  };
}

export const revalidate = 3600;

export default async function ImpressionsPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("gallery");

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
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
      />

      {/* GalleryClient reads ?team= from the URL, which needs a Suspense boundary. */}
      <Suspense>
        <GalleryClient items={items} />
      </Suspense>
    </>
  );
}
