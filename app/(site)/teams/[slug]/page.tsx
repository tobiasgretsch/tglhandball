import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type React from "react";
import Image from "next/image";
import { groq } from "next-sanity";
import { Calendar, MapPin, Shield, User } from "lucide-react";
import { client, urlFor } from "@/lib/sanity";
import {
  teamDetailQuery,
  teamUpcomingMatchesQuery,
  teamRecentResultsQuery,
} from "@/lib/queries";
import type { Team, Match, Betreuer } from "@/types";
import PortableText from "@/components/ui/PortableText";
import PricingSection from "@/components/sections/PricingSection";
import HandballWidget from "@/components/sections/HandballWidget";

// ─── Static params + metadata ─────────────────────────────────────────────────

export async function generateStaticParams() {
  const teams = await client
    .fetch<Array<{ slug: { current: string } }>>(
      groq`*[_type == "team"] { slug }`,
      {},
      { next: { revalidate: 3600 } }
    )
    .catch(() => []);

  return teams
    .filter((t) => t.slug?.current)
    .map((t) => ({ slug: t.slug.current }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const team = await client
    .fetch<Pick<Team, "name" | "league" | "headerImage">>(
      groq`*[_type == "team" && slug.current == $slug][0] { name, league, headerImage }`,
      { slug }
    )
    .catch(() => null);

  if (!team) return { title: "Mannschaft" };

  const description = team.league
    ? `${team.name} – ${team.league}. Kader, Spielplan und Ergebnisse bei TG MIPA Landshut.`
    : `${team.name} – Kader, Spielplan und Ergebnisse bei TG MIPA Landshut.`;

  const ogImage = team.headerImage
    ? urlFor(team.headerImage).width(1200).height(630).url()
    : undefined;

  return {
    title: team.league ? `${team.name} – ${team.league}` : team.name,
    description,
    openGraph: {
      title: team.name,
      description,
      type: "website",
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630, alt: team.name }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: team.name,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const revalidate = 3600;

export default async function TeamDetailPage({ params }: Props) {
  const { slug } = await params;
  const now = new Date().toISOString();

  const team = await client
    .fetch<Team>(teamDetailQuery, { slug }, { next: { revalidate: 3600 } })
    .catch(() => null);

  if (!team) notFound();

  const [upcoming, results] = await Promise.all([
    client
      .fetch<Match[]>(
        teamUpcomingMatchesQuery,
        { teamId: team._id, now },
        { next: { revalidate: 3600 } }
      )
      .catch(() => [] as Match[]),
    client
      .fetch<Match[]>(
        teamRecentResultsQuery,
        { teamId: team._id },
        { next: { revalidate: 3600 } }
      )
      .catch(() => [] as Match[]),
  ]);

  const heroUrl = team.headerImage
    ? urlFor(team.headerImage).width(1600).height(700).url()
    : null;

  return (
    <>
      {/* ── 1. Hero ────────────────────────────────────────────────────── */}
      <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-end overflow-hidden bg-accent">
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={team.name}
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
            placeholder={team.headerImage?.lqip ? "blur" : "empty"}
            blurDataURL={team.headerImage?.lqip ?? undefined}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent to-[#003a7a]" />
        )}
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-32 w-full">
          {team.league && (
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.25em] text-white/60 mb-3">
              {team.league}
            </span>
          )}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight">
            {team.name}
          </h1>
        </div>
      </section>

      {/* ── 2. About ──────────────────────────────────────────────────── */}
      {team.description && team.description.length > 0 && (
        <section className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
            <SectionHeading label="Über uns" />
            <PortableText value={team.description} className="mt-6" />
          </div>
        </section>
      )}

      {/* ── 3. Tabelle (nuLiga) — shown directly after About ──────────── */}
      {team.nuligaTeamId && (
        <section className="bg-background dark:bg-gray-900 py-14 md:py-20 border-b border-gray-100 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading label="Tabelle" />
            <WidgetCard>
              <HandballWidget teamId={team.nuligaTeamId} type="tabelle" />
            </WidgetCard>
          </div>
        </section>
      )}

      {/* ── 4. Coaching staff ─────────────────────────────────────────── */}
      {team.coaches && team.coaches.length > 0 && (
        <section className="bg-background dark:bg-gray-900 py-14 md:py-20 border-b border-gray-100 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading label="Trainerteam" />
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {team.coaches.map((coach) => {
                const coachImageUrl = coach.image
                  ? urlFor(coach.image).width(400).height(500).url()
                  : null;
                return (
                  <div
                    key={coach._key}
                    className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-[4/5] bg-gradient-to-b from-gray-100 dark:from-gray-600 to-gray-200 dark:to-gray-700 overflow-hidden">
                      {coachImageUrl ? (
                        <Image
                          src={coachImageUrl}
                          alt={coach.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover object-top"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <User size={32} className="text-muted/30 dark:text-gray-400/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 md:p-4">
                      <p className="font-bold text-text dark:text-gray-100 text-xs md:text-sm leading-tight truncate">
                        {coach.name}
                      </p>
                      {coach.role && (
                        <p className="text-muted dark:text-gray-400 text-[10px] md:text-xs mt-0.5 truncate">
                          {coach.role}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 7. Squad ──────────────────────────────────────────────────── */}
      {team.squad && team.squad.length > 0 && (
        <section className="bg-white dark:bg-gray-800 py-14 md:py-20 border-b border-gray-100 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading label="Kader" />
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {team.squad.map((player) => {
                const playerImageUrl = player.image
                  ? urlFor(player.image).width(400).height(500).url()
                  : null;
                return (
                  <div
                    key={player._key}
                    className="group bg-background dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-600 hover:shadow-md transition-shadow"
                  >
                    {/* Player image */}
                    <div className="relative aspect-[4/5] bg-gradient-to-b from-gray-100 dark:from-gray-600 to-gray-200 dark:to-gray-700 overflow-hidden">
                      {playerImageUrl ? (
                        <Image
                          src={playerImageUrl}
                          alt={player.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-cover object-top"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Shield size={32} className="text-muted/30 dark:text-gray-400/30" />
                        </div>
                      )}
                      {/* Jersey number badge */}
                      {player.number !== undefined && (
                        <span className="absolute top-2 left-2 bg-primary text-white text-xs md:text-sm font-black w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center leading-none shadow-sm">
                          {player.number}
                        </span>
                      )}
                    </div>
                    <div className="p-3 md:p-4">
                      <p className="font-bold text-text dark:text-gray-100 text-xs md:text-sm leading-tight truncate">
                        {player.name}
                      </p>
                      {player.position && (
                        <p className="text-muted dark:text-gray-400 text-[10px] md:text-xs mt-0.5 truncate">
                          {player.position}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 8. Betreuer ───────────────────────────────────────────────── */}
      {team.betreuer && team.betreuer.length > 0 && (
        <section className="bg-background dark:bg-gray-900 py-14 md:py-20 border-b border-gray-100 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading label="Betreuer" />
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {team.betreuer.map((b: Betreuer) => {
                const imageUrl = b.image
                  ? urlFor(b.image).width(400).height(500).url()
                  : null;
                return (
                  <div
                    key={b._key}
                    className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-[4/5] bg-gradient-to-b from-gray-100 dark:from-gray-600 to-gray-200 dark:to-gray-700 overflow-hidden">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={b.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover object-top"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <User size={32} className="text-muted/30 dark:text-gray-400/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 md:p-4">
                      <p className="font-bold text-text dark:text-gray-100 text-xs md:text-sm leading-tight truncate">
                        {b.name}
                      </p>
                      {b.role && (
                        <p className="text-muted dark:text-gray-400 text-[10px] md:text-xs mt-0.5 truncate">
                          {b.role}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 9 & 10: Schedule + Results (side by side on desktop) ─────── */}
      {(upcoming.length > 0 || results.length > 0) && (
        <section className="bg-background dark:bg-gray-900 py-14 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-10 md:gap-14">
              {/* Upcoming matches */}
              {upcoming.length > 0 && (
                <div>
                  <SectionHeading label="Nächste Spiele" />
                  <ul className="mt-6 space-y-3">
                    {upcoming.map((match) => (
                      <MatchRow key={match._id} match={match} isResult={false} />
                    ))}
                  </ul>
                </div>
              )}

              {/* Recent results */}
              {results.length > 0 && (
                <div>
                  <SectionHeading label="Letzte Ergebnisse" />
                  <ul className="mt-6 space-y-3">
                    {results.map((match) => (
                      <MatchRow key={match._id} match={match} isResult={true} />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── 8: nuLiga Spielplan ────────────────────────────────────────── */}
      {team.nuligaTeamId && (
        <section className="bg-background dark:bg-gray-900 py-14 md:py-20 border-b border-gray-100 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading label="Spielplan" />
            <WidgetCard>
              <HandballWidget teamId={team.nuligaTeamId} type="spielplan" />
            </WidgetCard>
          </div>
        </section>
      )}

      {/* ── 9. Pricing ────────────────────────────────────────────────── */}
      {team.pricingSection && (team.pricingSection.rows?.length ?? 0) > 0 && (
        <PricingSection data={team.pricingSection} />
      )}
    </>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────

/**
 * Modern card wrapper for nuLiga widgets.
 * On mobile: full-width, scrollable with a subtle right-fade hint.
 * On desktop: rounded card with shadow.
 */
function WidgetCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white p-4 md:p-6">
      {children}
    </div>
  );
}

function SectionHeading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="block w-8 h-[3px] bg-primary rounded-full shrink-0" />
      <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted dark:text-gray-400">
        {label}
      </h2>
    </div>
  );
}

function MatchRow({ match, isResult }: { match: Match; isResult: boolean }) {
  const date = new Date(match.date);
  const dateStr = new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const timeStr = new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return (
    <li className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 px-4 py-4 shadow-sm">
      {/* Teams */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text dark:text-gray-100 text-sm leading-tight truncate">
            {match.homeTeam}
          </p>
          <p className="text-muted dark:text-gray-400 text-xs mt-0.5">vs. {match.awayTeam}</p>
        </div>
        {isResult && match.result ? (
          <span className="text-lg font-black text-primary tabular-nums shrink-0">
            {match.result}
          </span>
        ) : (
          <span className="text-sm font-bold text-accent dark:text-blue-400 tabular-nums shrink-0">
            {timeStr}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
        <span className="flex items-center gap-1 text-[11px] text-muted dark:text-gray-400">
          <Calendar size={11} className="shrink-0" />
          {dateStr}
        </span>
        {match.venue && (
          <span className="flex items-center gap-1 text-[11px] text-muted dark:text-gray-400">
            <MapPin size={11} className="shrink-0" />
            {match.venue}
          </span>
        )}
        {match.isHomeGame !== undefined && (
          <span
            className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
              match.isHomeGame
                ? "bg-primary/10 text-primary"
                : "bg-gray-100 dark:bg-gray-700 text-muted dark:text-gray-400"
            }`}
          >
            {match.isHomeGame ? "Heim" : "Auswärts"}
          </span>
        )}
      </div>
    </li>
  );
}
