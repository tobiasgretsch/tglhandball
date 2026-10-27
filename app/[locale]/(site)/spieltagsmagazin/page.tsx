import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { DEFAULT_OG_IMAGE, localizedAlternates } from "@/lib/seo";
import { routing } from "@/i18n/routing";
import { client } from "@/lib/sanity";
import { allMagazinesQuery, pageHeroSlidesQuery } from "@/lib/queries";
import type { Magazine, SanityImage } from "@/types";
import MagazineClient from "@/components/sections/MagazineClient";
import PageHeroSlider from "@/components/sections/PageHeroSlider";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "magazine" });
  return {
    alternates: localizedAlternates("/spieltagsmagazin", locale),
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

export const revalidate = 300;

export default async function SpieltagsmagazinPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("magazine");

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
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
      />

      <MagazineClient magazines={magazines} />
    </>
  );
}
