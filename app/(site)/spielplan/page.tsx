import type { Metadata } from "next";
import { client } from "@/lib/sanity";
import { spielplanQuery, allTeamsQuery, pageHeroSlidesQuery } from "@/lib/queries";
import type { Match, Team, SanityImage } from "@/types";
import SpielplanClient from "@/components/sections/SpielplanClient";
import PageHeroSlider from "@/components/sections/PageHeroSlider";

export const metadata: Metadata = {
  title: "Spielplan & Ergebnisse | TG MIPA Landshut Handball",
  description:
    "Alle Spiele und Ergebnisse der TG MIPA Landshut Handball-Mannschaften.",
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
      <PageHeroSlider slides={slides ?? []}>
        <span className="absolute right-6 bottom-0 text-[120px] md:text-[200px] font-black text-white/5 leading-none select-none pointer-events-none">
          SPIELE
        </span>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-[132px] lg:pt-[140px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/50 mb-3">
            TG MIPA Landshut
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight">
            Spielplan &amp; Ergebnisse
          </h1>
        </div>
      </PageHeroSlider>

      <SpielplanClient matches={matches} teams={teamOptions} />
    </>
  );
}
