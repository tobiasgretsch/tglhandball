import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { client } from "@/lib/sanity";
import { pageHeroSlidesQuery } from "@/lib/queries";
import { getTicker } from "@/lib/live/ticker";
import type { TickerSnapshot } from "@/lib/live/types";
import type { SanityImage } from "@/types";
import PageHeroSlider from "@/components/sections/PageHeroSlider";
import LiveTicker from "@/components/live/LiveTicker";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ meetingId: string }>;
}

type TickerLookup = { found: true; snapshot: TickerSnapshot | null } | { found: false };

/** Distinguishes "no such game" from "nuLiga is down" — the latter still renders and keeps retrying. */
async function lookup(meetingId: string): Promise<TickerLookup> {
  try {
    const result = await getTicker(meetingId);
    return result ? { found: true, snapshot: result.snapshot } : { found: false };
  } catch {
    return { found: true, snapshot: null };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { meetingId } = await params;
  const result = await lookup(meetingId);
  const game = result.found ? result.snapshot?.game : undefined;
  const title = game ? `Live: ${game.homeTeam} – ${game.awayTeam}` : "Live-Ticker";
  // A moment-in-time page: nothing worth indexing.
  return { title, robots: { index: false, follow: true } };
}

export default async function LiveTickerPage({ params }: PageProps) {
  const { meetingId } = await params;
  const [result, slides] = await Promise.all([
    lookup(meetingId),
    client
      .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as SanityImage[]),
  ]);
  if (!result.found) notFound();

  const game = result.snapshot?.game;
  return (
    <>
      <PageHeroSlider
        slides={slides ?? []}
        title="Live-Ticker"
        subtitle={game ? `${game.homeTeam} – ${game.awayTeam}` : "Spielverlauf in Echtzeit"}
      />
      <section className="bg-background dark:bg-gray-900">
        <div className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6">
          <LiveTicker meetingId={meetingId} initial={result.snapshot} />
          <p className="mt-8 text-center text-sm">
            <Link href="/live" className="font-bold text-primary underline-offset-4 hover:underline">
              Alle Live-Spiele
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
