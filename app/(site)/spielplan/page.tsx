import type { Metadata } from "next";
import { client } from "@/lib/sanity";
import { spielplanQuery, allTeamsQuery, pageHeroSlidesQuery } from "@/lib/queries";
import type { Match, Team, SanityImage } from "@/types";
import SpielplanClient from "@/components/sections/SpielplanClient";
import PageHeroSlider from "@/components/sections/PageHeroSlider";

export const metadata: Metadata = {
  title: "Spielplan & Ergebnisse",
  description:
    "Alle Spiele, Termine und Ergebnisse der TG MIPA Landshut-Mannschaften auf einen Blick.",
  openGraph: {
    title: "Spielplan & Ergebnisse | TG MIPA Landshut",
    description: "Alle Spiele, Termine und Ergebnisse der TG MIPA Landshut-Mannschaften auf einen Blick.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const revalidate = 3600;

export default async function SpielplanPage() {
  const [matches, teams, slides] = await Promise.all([
    client
      .fetch<Match[]>(spielplanQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as Match[]),
    client
      .fetch<Team[]>(allTeamsQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as Team[]),
    client
      .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as SanityImage[]),
  ]);

  const teamOptions = teams.map((t) => ({ _id: t._id, name: t.name }));

  return (
    <>
      <PageHeroSlider
        slides={slides ?? []}
        title="Spielplan &amp; Ergebnisse"
        subtitle="Alle Spiele und Ergebnisse der TG MIPA Landshut-Mannschaften."
      />

      <SpielplanClient matches={matches} teams={teamOptions} />
    </>
  );
}
