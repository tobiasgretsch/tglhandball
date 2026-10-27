import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { groq } from "next-sanity";
import { upcomingSince } from "@/lib/match";
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
  teamGalleryQuery,
  settingsQuery,
} from "@/lib/queries";
import type { Team, Match, GalleryItem, Betreuer, Settings, TrainingDay, TrainingTime } from "@/types";
import PersonCard from "@/components/ui/PersonCard";
import { toPersonPhoto } from "@/lib/personPhoto";
import PortableText from "@/components/ui/PortableText";
import Reveal from "@/components/ui/Reveal";
import { CLUB_TIME_ZONE } from "@/lib/dates";
import { gamePagePath, hasKickedOff } from "@/lib/match";
import PricingSection from "@/components/sections/PricingSection";
import StandingsTable from "@/components/sections/StandingsTable";
import GalleryRow from "@/components/sections/GalleryRow";
import { LiveMatchBadge } from "@/components/live/LiveBadge";
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
  const since = upcomingSince();

  const team = await client
    .fetch<Team>(teamDetailQuery, { slug }, { next: { revalidate: 3600 } })
    .catch(() => null);

  if (!team) notFound();

  const [upcoming, results, settings, standings, photos] = await Promise.all([
    client
      .fetch<Match[]>(
        teamUpcomingMatchesQuery,
        { teamId: team._id, since },
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
    client
      .fetch<Pick<GalleryItem, "_id" | "image" | "caption">[]>(
        teamGalleryQuery,
        { teamId: team._id },
        { next: { revalidate: 3600 } }
      )
      .catch(() => []),
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

      {/* ── 3. Spiele — directly after About, the most-visited part ───── */}
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
              href={`/spielplan?team=${slug}`}
              className="btn btn-primary press mt-10"
            >
              Gesamter Spielplan <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      {/* ── 3b. Galerie ───────────────────────────────────────────────── */}
      <GalleryRow photos={photos} filter={slug} />

      {/* ── 4. Tabelle (nuLiga) ───────────────────────────────────────── */}
      {team.nuligaTableUrl && standings.length > 0 && (
        <section id="tabelle" className="bg-background dark:bg-gray-900 py-14 md:py-20 scroll-mt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading label="Tabelle" />
            <StandingsTable rows={standings} sourceUrl={team.nuligaTableUrl} />
          </div>
        </section>
      )}

      {/* ── 5. Trainingszeiten ───────────────────────────────────────── */}
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
              {team.coaches.map((coach) => (
                <PersonCard
                  key={coach._key}
                  name={coach.name}
                  subtitle={coach.role}
                  photo={toPersonPhoto(coach.image)}
                  photoBack={toPersonPhoto(coach.imageBack, "center")}
                  fallbackIcon={<User size={32} className="text-muted/30" />}
                  surfaceClassName="dark:bg-gray-800"
                />
              ))}
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
              {team.squad.map((player) => (
                <PersonCard
                  key={player._key}
                  name={player.name}
                  subtitle={player.position}
                  badge={player.number}
                  photo={toPersonPhoto(player.image)}
                  photoBack={toPersonPhoto(player.imageBack, "center")}
                  fallbackIcon={<Shield size={32} className="text-muted/30" />}
                  surfaceClassName="bg-background dark:bg-gray-700"
                />
              ))}
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
              {team.betreuer.map((b: Betreuer) => (
                <PersonCard
                  key={b._key}
                  name={b.name}
                  subtitle={b.role}
                  photo={toPersonPhoto(b.image)}
                  photoBack={toPersonPhoto(b.imageBack, "center")}
                  fallbackIcon={<User size={32} className="text-muted/30" />}
                  surfaceClassName="dark:bg-gray-800"
                />
              ))}
            </div>
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
          <p className="text-muted text-xs mt-0.5">vs. {match.awayTeam}</p>
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
        <LiveMatchBadge match={match} />
        <span className="flex items-center gap-1 text-xs text-muted">
          <Calendar size={12} className="shrink-0" aria-hidden="true" />
          {dateStr}
        </span>
        {match.venue && (
          <span className="flex items-center gap-1 text-xs text-muted">
            <MapPin size={12} className="shrink-0" aria-hidden="true" />
            {match.venue}
          </span>
        )}
        {match.isHomeGame !== undefined && (
          <span
            className={`text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${
              match.isHomeGame
                ? "bg-primary/10 text-primary dark:text-primary-glow"
                : "bg-gray-100 dark:bg-gray-700 text-muted"
            }`}
          >
            {match.isHomeGame ? "Heim" : "Auswärts"}
          </span>
        )}
        {isResult && match.meetingId && (
          <span className="ml-auto flex items-center gap-2">
            {gamePagePath(match) && (
              <Link
                href={gamePagePath(match) ?? "/spielplan"}
                className="press inline-flex min-h-9 items-center rounded-full border border-gray-200 px-3 text-xs font-bold text-text transition-colors hover:border-primary hover:text-brand-red dark:border-gray-600 dark:text-gray-100"
              >
                Spielverlauf
              </Link>
            )}
            <MatchReportButton meetingId={match.meetingId} />
          </span>
        )}
        {!isResult && !hasKickedOff(match.date) && (
          <span className="ml-auto">
            <AddToCalendarButton match={match} compact />
          </span>
        )}
      </div>
    </li>
  );
}
