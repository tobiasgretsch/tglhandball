import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { client } from "@/lib/sanity";
import { pageHeroSlidesQuery } from "@/lib/queries";
import { CLUB_TIME_ZONE } from "@/lib/dates";
import { getLiveSummary } from "@/lib/live/schedule";
import type { LiveGame, LiveSummary } from "@/lib/live/types";
import type { SanityImage } from "@/types";
import PageHeroSlider from "@/components/sections/PageHeroSlider";
import LiveGameList from "@/components/live/LiveGameList";
import { LiveListSkeleton } from "@/components/live/LiveSkeleton";

export const metadata: Metadata = {
  alternates: { canonical: "/live" },
  title: "Live-Ticker",
  description: "Live-Ergebnisse und Ticker der Spiele von TG MIPA Landshut.",
  openGraph: { title: "Live-Ticker | TG MIPA Landshut", type: "website" },
};

/** One shared render per interval instead of one function per visitor; the header badge polls the live flag itself. */
export const revalidate = 15;
export const maxDuration = 15;

const LIST_LIMIT = 8;

/** `null` when nuLiga could not be reached, so the page can say so instead of showing "no games". */
async function loadSummary(): Promise<LiveSummary | null> {
  try {
    return await getLiveSummary();
  } catch {
    return null;
  }
}

/** Streams in behind a skeleton: on a cold instance nuLiga needs several seconds to answer. */
async function LiveGames() {
  const summary = await loadSummary();
  if (summary === null) {
    return (
      <p
        role="status"
        className="rounded-2xl bg-white p-6 text-center text-muted dark:bg-gray-800 dark:text-gray-300"
      >
        Die Live-Daten sind gerade nicht erreichbar. Bitte versuche es in einem Moment erneut.
      </p>
    );
  }

  // The summary's own timestamp, so "upcoming" and "live" agree with each other.
  const now = summary.updatedAt;
  const startOf = (g: LiveGame) => new Date(g.scheduled).getTime();
  const live = summary.games.filter((g) => g.live);
  const upcoming = summary.games.filter((g) => !g.live && startOf(g) > now).slice(0, LIST_LIMIT);
  const finished = summary.games
    .filter((g) => !g.live && startOf(g) <= now)
    .sort((a, b) => startOf(b) - startOf(a))
    .slice(0, LIST_LIMIT);

  return (
    <>
      <LiveGameList
        title="Läuft gerade"
        games={live}
        timeZone={CLUB_TIME_ZONE}
        emptyText="Im Moment läuft kein Spiel."
      />
      <LiveGameList title="Als Nächstes" games={upcoming} timeZone={CLUB_TIME_ZONE} />
      <LiveGameList title="Zuletzt gespielt" games={finished} timeZone={CLUB_TIME_ZONE} />
    </>
  );
}

export default async function LivePage() {
  // Only the cached hero images are awaited here, so the hero paints immediately.
  const slides = await client
    .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
    .catch(() => [] as SanityImage[]);

  return (
    <>
      <PageHeroSlider
        slides={slides ?? []}
        title="Live-Ticker"
        subtitle="Spielstand und Spielverlauf unserer Mannschaften – direkt aus der Halle."
      />
      <section className="bg-background dark:bg-gray-900">
        <div className="mx-auto max-w-3xl space-y-10 px-4 pb-20 pt-6 sm:px-6">
          <Suspense fallback={<LiveListSkeleton />}>
            <LiveGames />
          </Suspense>
          <p className="text-center text-sm text-muted">
            Alle Termine findest du im{" "}
            <Link href="/spielplan" className="font-bold text-brand-red underline-offset-4 hover:underline">
              Spielplan
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
