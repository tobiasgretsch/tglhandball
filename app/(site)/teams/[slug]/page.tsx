import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { groq } from "next-sanity";
import JsonLd from "@/components/ui/JsonLd";
import { breadcrumbJsonLd, fixturesJsonLd, sportsTeamJsonLd } from "@/lib/seo";
import MatchReportButton from "@/components/ui/MatchReportButton";
import AddToCalendarButton from "@/components/ui/AddToCalendarButton";
import { ArrowRight, Calendar, Clock, MapPin, Shield, User } from "lucide-react";
import { client, urlFor } from "@/lib/sanity";
import {
  teamDetailQuery,
  teamUpcomingMatchesQuery,
  teamRecentResultsQuery,
  settingsQuery,
} from "@/lib/queries";
import type { Team, Match, Betreuer, Settings, TrainingDay, TrainingTime } from "@/types";
import PortableText from "@/components/ui/PortableText";
import Reveal from "@/components/ui/Reveal";
import { CLUB_TIME_ZONE } from "@/lib/dates";
import PricingSection from "@/components/sections/PricingSection";
import StandingsTable from "@/components/sections/StandingsTable";
import { fetchStandings } from "@/lib/nuliga/standings";

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
    alternates: { canonical: `/teams/${slug}` },
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

  const [upcoming, results, settings, standings] = await Promise.all([
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
    client
      .fetch<Settings>(settingsQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => null),
    team.nuligaTableUrl ? fetchStandings(team.nuligaTableUrl) : Promise.resolve([]),
  ]);

  const heroUrl = team.headerImage
    ? urlFor(team.headerImage).width(1600).height(700).url()
    : null;

  // The sheet edge takes the colour of the first section below the hero.
  const hasAbout = (team.description?.length ?? 0) > 0;
  const heroSheet = hasAbout
    ? "bg-white dark:bg-gray-800"
    : "bg-background dark:bg-gray-900";

  const structuredData = [
    sportsTeamJsonLd({
      name: team.name,
      path: `/teams/${slug}`,
      league: team.league,
      imageUrl: heroUrl ?? undefined,
    }),
    breadcrumbJsonLd([
      { name: "Startseite", path: "/" },
      { name: "Teams", path: "/teams" },
      { name: team.name, path: `/teams/${slug}` },
    ]),
    fixturesJsonLd([...results, ...upcoming], settings),
  ].filter((entry): entry is Record<string, unknown> => entry !== null);

  return (
    <>
      <JsonLd data={structuredData} />
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
          <div className="absolute inset-0 bg-gradient-to-br from-accent to-accent-deep" />
        )}
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-accent-dark/85 via-black/25 to-black/10" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20 pt-32 w-full">
          <Reveal>
            {team.league && (
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/80 mb-3">
                {team.league}
              </p>
            )}
            <h1 className="font-display font-bold italic uppercase text-5xl md:text-6xl lg:text-7xl text-white tracking-[-0.03em] leading-[0.92] text-balance">
              {team.name}
            </h1>
          </Reveal>
        </div>

        {/* Rounded sheet edge — same language as PageHeroSlider */}
        <div
          aria-hidden="true"
          className={`absolute inset-x-0 bottom-0 h-8 md:h-12 sheet-top ${heroSheet}`}
        />
      </section>

      {/* ── 2. About ──────────────────────────────────────────────────── */}
      {team.description && team.description.length > 0 && (
        <section className="bg-white dark:bg-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
            <SectionHeading label="Über uns" />
            <PortableText value={team.description} className="mt-6" />
          </div>
        </section>
      )}

      {/* ── 3. Tabelle (nuLiga) — shown directly after About ──────────── */}
      {team.nuligaTableUrl && standings.length > 0 && (
        <section className="bg-background dark:bg-gray-900 py-14 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading label="Tabelle" />
            <StandingsTable rows={standings} sourceUrl={team.nuligaTableUrl} />
          </div>
        </section>
      )}

      {/* ── 3b. Trainingszeiten ───────────────────────────────────────── */}
      {team.trainingTimes && team.trainingTimes.length > 0 && (
        <section className="bg-white dark:bg-gray-800 py-14 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading label="Trainingszeiten" />
            <ul className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortTrainingTimes(team.trainingTimes).map((slot) => (
                <TrainingSlot key={slot._key} slot={slot} />
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── 4. Coaching staff ─────────────────────────────────────────── */}
      {team.coaches && team.coaches.length > 0 && (
        <section className="bg-background dark:bg-gray-900 py-14 md:py-20">
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
                    className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-[0_1px_2px_rgb(0_0_0/0.05)] hover:shadow-[0_12px_32px_-12px_rgb(0_0_0/0.25)] transition-shadow duration-300"
                  >
                    <div className="relative aspect-[4/5] bg-gradient-to-b from-gray-100 dark:from-gray-600 to-gray-200 dark:to-gray-700 overflow-hidden">
                      {coachImageUrl ? (
                        <Image
                          src={coachImageUrl}
                          alt={coach.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover object-top motion-safe:group-hover:scale-[1.03] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <User size={32} className="text-muted/30 dark:text-gray-400/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 md:p-4">
                      <p className="font-semibold text-text dark:text-gray-100 text-sm leading-tight truncate">
                        {coach.name}
                      </p>
                      {coach.role && (
                        <p className="text-muted dark:text-gray-400 text-xs mt-0.5 truncate">
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
        <section className="bg-white dark:bg-gray-800 py-14 md:py-20">
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
                    className="group bg-background dark:bg-gray-700 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-600 shadow-[0_1px_2px_rgb(0_0_0/0.05)] hover:shadow-[0_12px_32px_-12px_rgb(0_0_0/0.25)] transition-shadow duration-300"
                  >
                    {/* Player image */}
                    <div className="relative aspect-[4/5] bg-gradient-to-b from-gray-100 dark:from-gray-600 to-gray-200 dark:to-gray-700 overflow-hidden">
                      {playerImageUrl ? (
                        <Image
                          src={playerImageUrl}
                          alt={player.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-cover object-top motion-safe:group-hover:scale-[1.03] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Shield size={32} className="text-muted/30 dark:text-gray-400/30" />
                        </div>
                      )}
                      {/* Jersey number badge */}
                      {player.number !== undefined && (
                        <span className="absolute top-2 left-2 bg-primary text-white text-xs md:text-sm font-bold tabular-nums w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center leading-none shadow-sm">
                          {player.number}
                        </span>
                      )}
                    </div>
                    <div className="p-3 md:p-4">
                      <p className="font-semibold text-text dark:text-gray-100 text-sm leading-tight truncate">
                        {player.name}
                      </p>
                      {player.position && (
                        <p className="text-muted dark:text-gray-400 text-xs mt-0.5 truncate">
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
        <section className="bg-background dark:bg-gray-900 py-14 md:py-20">
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
                    className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-[0_1px_2px_rgb(0_0_0/0.05)] hover:shadow-[0_12px_32px_-12px_rgb(0_0_0/0.25)] transition-shadow duration-300"
                  >
                    <div className="relative aspect-[4/5] bg-gradient-to-b from-gray-100 dark:from-gray-600 to-gray-200 dark:to-gray-700 overflow-hidden">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={b.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover object-top motion-safe:group-hover:scale-[1.03] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <User size={32} className="text-muted/30 dark:text-gray-400/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 md:p-4">
                      <p className="font-semibold text-text dark:text-gray-100 text-sm leading-tight truncate">
                        {b.name}
                      </p>
                      {b.role && (
                        <p className="text-muted dark:text-gray-400 text-xs mt-0.5 truncate">
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
            <Link
              href="/spielplan"
              className="btn btn-primary press mt-10"
            >
              Gesamter Spielplan <ArrowRight size={14} aria-hidden="true" />
            </Link>
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

function SectionHeading({ label }: { label: string }) {
  return (
    <Reveal>
      <h2 className="font-display font-bold italic uppercase text-4xl md:text-5xl tracking-[-0.02em] text-text dark:text-gray-100">
        {label}
      </h2>
    </Reveal>
  );
}

const TRAINING_DAYS: readonly TrainingDay[] = ["mo", "di", "mi", "do", "fr", "sa", "so"];

const TRAINING_DAY_LABEL: Record<TrainingDay, string> = {
  mo: "Montag",
  di: "Dienstag",
  mi: "Mittwoch",
  do: "Donnerstag",
  fr: "Freitag",
  sa: "Samstag",
  so: "Sonntag",
};

function sortTrainingTimes(slots: TrainingTime[]): TrainingTime[] {
  return [...slots].sort(
    (a, b) =>
      TRAINING_DAYS.indexOf(a.day) - TRAINING_DAYS.indexOf(b.day) ||
      a.startTime.localeCompare(b.startTime)
  );
}

function TrainingSlot({ slot }: { slot: TrainingTime }) {
  return (
    <li className="bg-background dark:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-600 px-5 py-4 shadow-[0_1px_2px_rgb(0_0_0/0.05)]">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary dark:text-primary-glow">
        {TRAINING_DAY_LABEL[slot.day]}
      </p>
      <p className="mt-1 font-display font-bold text-2xl text-text dark:text-gray-100 tabular-nums">
        {slot.startTime}
        {slot.endTime ? `–${slot.endTime}` : ""} Uhr
      </p>
      {slot.location && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted dark:text-gray-300">
          <MapPin size={13} className="shrink-0" aria-hidden="true" />
          {slot.location}
        </p>
      )}
      {slot.note && (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted dark:text-gray-300">
          <Clock size={13} className="shrink-0" aria-hidden="true" />
          {slot.note}
        </p>
      )}
    </li>
  );
}

function MatchRow({ match, isResult }: { match: Match; isResult: boolean }) {
  const date = new Date(match.date);
  const dateStr = new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: CLUB_TIME_ZONE,
  }).format(date);
  const timeStr = new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: CLUB_TIME_ZONE,
  }).format(date);

  return (
    <li className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-4 py-4 shadow-[0_1px_2px_rgb(0_0_0/0.05)]">
      {/* Teams */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text dark:text-gray-100 text-sm leading-tight truncate">
            {match.homeTeam}
          </p>
          <p className="text-muted dark:text-gray-400 text-xs mt-0.5">vs. {match.awayTeam}</p>
        </div>
        {isResult && match.result ? (
          <span className="text-lg font-bold text-primary dark:text-primary-glow tabular-nums shrink-0">
            {match.result}
          </span>
        ) : (
          <span className="text-sm font-bold text-accent dark:text-accent-sky tabular-nums shrink-0">
            {timeStr}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
        <span className="flex items-center gap-1 text-xs text-muted dark:text-gray-400">
          <Calendar size={12} className="shrink-0" aria-hidden="true" />
          {dateStr}
        </span>
        {match.venue && (
          <span className="flex items-center gap-1 text-xs text-muted dark:text-gray-400">
            <MapPin size={12} className="shrink-0" aria-hidden="true" />
            {match.venue}
          </span>
        )}
        {match.isHomeGame !== undefined && (
          <span
            className={`text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${
              match.isHomeGame
                ? "bg-primary/10 text-primary dark:text-primary-glow"
                : "bg-gray-100 dark:bg-gray-700 text-muted dark:text-gray-400"
            }`}
          >
            {match.isHomeGame ? "Heim" : "Auswärts"}
          </span>
        )}
        {isResult && match.meetingId && (
          <span className="ml-auto">
            <MatchReportButton meetingId={match.meetingId} />
          </span>
        )}
        {!isResult && (
          <span className="ml-auto">
            <AddToCalendarButton match={match} compact />
          </span>
        )}
      </div>
    </li>
  );
}
