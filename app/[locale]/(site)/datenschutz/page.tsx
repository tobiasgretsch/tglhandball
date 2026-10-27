import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { DEFAULT_OG_IMAGE, localizedAlternates } from "@/lib/seo";
import { routing } from "@/i18n/routing";
import { client } from "@/lib/sanity";
import { pageHeroSlidesQuery } from "@/lib/queries";
import type { SanityImage } from "@/types";
import LegalDocument from "@/components/ui/LegalDocument";
import PageHeroSlider from "@/components/sections/PageHeroSlider";
import { DATENSCHUTZ_BLOCKS } from "./content";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "legal" });
  return {
    alternates: localizedAlternates("/datenschutz", locale),
    title: t("datenschutz.title"),
    description: t("datenschutz.description"),
    robots: { index: false, follow: false },
    openGraph: {
      title: `${t("datenschutz.title")} | TG MIPA Landshut`,
      description: t("datenschutz.description"),
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE.url] },
  };
}

function LegalLanguageNote({ text }: { text: string }) {
  return (
    <div className="bg-background dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <p
          role="note"
          className="rounded-xl bg-accent-tint dark:bg-accent/15 px-5 py-4 text-sm font-medium leading-relaxed text-text dark:text-gray-200"
        >
          {text}
        </p>
      </div>
    </div>
  );
}

export default async function DatenschutzPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  const slides = await client
    .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
    .catch(() => [] as SanityImage[]);

  return (
    <>
      <PageHeroSlider slides={slides ?? []} title={t("datenschutz.hero.title")} subtitle={t("datenschutz.hero.subtitle")} />
      {locale !== routing.defaultLocale && <LegalLanguageNote text={t("datenschutz.note")} />}
      <LegalDocument blocks={DATENSCHUTZ_BLOCKS} />
    </>
  );
}
