import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { client } from "@/lib/sanity";
import JsonLd from "@/components/ui/JsonLd";
import { DEFAULT_OG_IMAGE, breadcrumbJsonLd, fixturesJsonLd, localizedAlternates } from "@/lib/seo";
import { seasonOf } from "@/lib/spielplanFilter";
import { spielplanQuery, allTeamsQuery, pageHeroSlidesQuery, settingsQuery } from "@/lib/queries";
import type { Match, Team, SanityImage, Settings } from "@/types";
import SpielplanClient from "@/components/sections/SpielplanClient";
import PageHeroSlider from "@/components/sections/PageHeroSlider";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "spielplanPage" });
  return {
    alternates: localizedAlternates("/spielplan", locale),
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: `${t("title")} | TG MIPA Landshut`,
      description: t("description"),
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE.url] },
  };
}

export const revalidate = 3600;

export default async function SpielplanPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("spielplanPage");
  const [matches, teams, slides, settings] = await Promise.all([
    client
      .fetch<Match[]>(spielplanQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as Match[]),
    client
      .fetch<Team[]>(allTeamsQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as Team[]),
    client
      .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as SanityImage[]),
    client
      .fetch<Settings>(settingsQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => null),
  ]);

  const structuredData = [
    breadcrumbJsonLd([
      { name: t("breadcrumbHome"), path: getPathname({ locale, href: "/" }) },
      { name: t("title"), path: getPathname({ locale, href: "/spielplan" }) },
    ]),
    fixturesJsonLd(matches, settings, locale),
  ].filter((entry): entry is Record<string, unknown> => entry !== null);

  const teamOptions = teams.map((t) => ({ _id: t._id, name: t.name, slug: t.slug.current, hasTable: t.hasTable === true }));

  return (
    <>
      <JsonLd data={structuredData} />
      <PageHeroSlider
        slides={slides ?? []}
        title={t("title")}
        subtitle={t("heroSubtitle")}
      />

      <SpielplanClient matches={matches} teams={teamOptions} currentSeason={seasonOf(new Date().toISOString())} />
    </>
  );
}
