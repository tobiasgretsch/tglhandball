import type { Metadata } from "next";
import Link from "next/link";
import { client } from "@/lib/sanity";
import { pageHeroSlidesQuery } from "@/lib/queries";
import { CLUB_TIME_ZONE } from "@/lib/dates";
import { getLiveSummary } from "@/lib/live/schedule";
import type { LiveGame } from "@/lib/live/types";
import type { SanityImage } from "@/types";
import PageHeroSlider from "@/components/sections/PageHeroSlider";
import LiveGameList from "@/components/live/LiveGameList";

export const metadata: Metadata = {
  alternates: { canonical: "/live" },
  title: "Live-Ticker",
  description: "Live-Ergebnisse und Ticker der Spiele von TG MIPA Landshut.",
  openGraph: { title: "Live-Ticker | TG MIPA Landshut", type: "website" },
};

export const dynamic = "force-dynamic";

const LIST_LIMIT = 8;

/** `null` when nuLiga could not be reached, so the page can say so instead of showing "no games". */
async function loadGames(): Promise<LiveGame[] | null> {
  try {
    return (await getLiveSummary()).games;
  } catch {
    return null;
  }
}

export default async function LivePage() {
  const [games, slides] = await Promise.all([
    loadGames(),
    client
      .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as SanityImage[]),
  ]);

  const now = Date.now();
  const startOf = (g: LiveGame) => new Date(g.scheduled).getTime();
  const all = games ?? [];
  const live = all.filter((g) => g.live);
  const upcoming = all.filter((g) => !g.live && startOf(g) > now).slice(0, LIST_LIMIT);
  const finished = all
    .filter((g) => !g.live && startOf(g) <= now)
    .sort((a, b) => startOf(b) - startOf(a))
    .slice(0, LIST_LIMIT);

  return (
    <>
      <PageHeroSlider
        slides={slides ?? []}
        title="Live-Ticker"
        subtitle="Spielstand und Spielverlauf unserer Mannschaften – direkt aus der Halle."
      />
      <section className="bg-background dark:bg-gray-900">
        <div className="mx-auto max-w-3xl space-y-10 px-4 pb-20 pt-6 sm:px-6">
          {games === null ? (
            <p
              role="status"
              className="rounded-2xl bg-white p-6 text-center text-muted dark:bg-gray-800 dark:text-gray-300"
            >
              Die Live-Daten sind gerade nicht erreichbar. Bitte versuche es in einem Moment erneut.
            </p>
          ) : (
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
          )}
          <p className="text-center text-sm text-muted dark:text-gray-400">
            Alle Termine findest du im{" "}
            <Link href="/spielplan" className="font-bold text-primary underline-offset-4 hover:underline">
              Spielplan
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
