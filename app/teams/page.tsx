import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { client, urlFor } from "@/lib/sanity";
import { allTeamsQuery, pageHeroSlidesQuery } from "@/lib/queries";
import type { Team, SanityImage } from "@/types";
import PageHeroSlider from "@/components/sections/PageHeroSlider";

export const metadata: Metadata = {
  title: "Unsere Teams | TGL MIPA Landshut Handball",
  description: "Alle Mannschaften des TGL MIPA Landshut – von der ersten Herrenmannschaft bis zur Jugend.",
};

export const revalidate = 3600;

export default async function TeamsPage() {
  const [teams, slides] = await Promise.all([
    client
      .fetch<Team[]>(allTeamsQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as Team[]),
    client
      .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as SanityImage[]),
  ]);

  return (
    <>
      <PageHeroSlider
        slides={slides ?? []}
        className="min-h-[348px] md:min-h-[408px] lg:min-h-[416px] flex items-end"
      >
        <span className="absolute right-8 bottom-0 text-[180px] md:text-[260px] font-black text-white/5 leading-none select-none pointer-events-none">
          TEAMS
        </span>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-16 w-full">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/50 mb-3">
            TGL MIPA Landshut
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight">
            Unsere Teams
          </h1>
        </div>
      </PageHeroSlider>

      {/* Team grid */}
      <section className="bg-background dark:bg-gray-900 py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {teams.length === 0 ? (
            <p className="text-muted text-center py-16">
              Keine Teams gefunden. Bitte Teams im CMS anlegen.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {teams.map((team) => (
                <TeamCard key={team._id} team={team} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function TeamCard({ team }: { team: Team }) {
  const imageUrl = team.headerImage
    ? urlFor(team.headerImage).width(480).height(360).url()
    : null;

  return (
    <Link
      href={`/teams/${team.slug.current}`}
      className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col"
    >
      {/* Header image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={team.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/15 flex items-center justify-center">
            <span className="text-5xl font-black text-accent/20 select-none">
              TGL
            </span>
          </div>
        )}
        {/* Red accent bar at bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1">
        <h2 className="font-black text-text dark:text-gray-100 text-sm md:text-base leading-tight">
          {team.name}
        </h2>
        {team.league && (
          <p className="text-muted dark:text-gray-400 text-xs mt-1 leading-snug">{team.league}</p>
        )}
        <div className="mt-auto pt-4">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary uppercase tracking-wider group-hover:gap-2 transition-all duration-200">
            Zum Team
            <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}
