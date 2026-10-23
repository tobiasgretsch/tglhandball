import type { Metadata } from "next";
import { client } from "@/lib/sanity";
import JsonLd from "@/components/ui/JsonLd";
import { DEFAULT_OG_IMAGE, breadcrumbJsonLd, fixturesJsonLd } from "@/lib/seo";
import { seasonOf } from "@/lib/spielplanFilter";
import { spielplanQuery, allTeamsQuery, pageHeroSlidesQuery, settingsQuery } from "@/lib/queries";
import type { Match, Team, SanityImage, Settings } from "@/types";
import SpielplanClient from "@/components/sections/SpielplanClient";
import PageHeroSlider from "@/components/sections/PageHeroSlider";

export const metadata: Metadata = {
  alternates: { canonical: "/spielplan" },
  title: "Spielplan & Ergebnisse",
  description:
    "Alle Spiele, Termine und Ergebnisse der TG MIPA Landshut-Mannschaften auf einen Blick.",
  openGraph: {
    title: "Spielplan & Ergebnisse | TG MIPA Landshut",
    description: "Alle Spiele, Termine und Ergebnisse der TG MIPA Landshut-Mannschaften auf einen Blick.",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE.url] },
};

export const revalidate = 3600;

export default async function SpielplanPage() {
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
      { name: "Startseite", path: "/" },
      { name: "Spielplan & Ergebnisse", path: "/spielplan" },
    ]),
    fixturesJsonLd(matches, settings),
  ].filter((entry): entry is Record<string, unknown> => entry !== null);

  const teamOptions = teams.map((t) => ({ _id: t._id, name: t.name, slug: t.slug.current, hasTable: t.hasTable === true }));

  return (
    <>
      <JsonLd data={structuredData} />
      <PageHeroSlider
        slides={slides ?? []}
        title="Spielplan &amp; Ergebnisse"
        subtitle="Alle Spiele und Ergebnisse der TG MIPA Landshut-Mannschaften."
      />

      <SpielplanClient matches={matches} teams={teamOptions} currentSeason={seasonOf(new Date().toISOString())} />
    </>
  );
}
