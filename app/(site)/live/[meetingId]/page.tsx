import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { client } from "@/lib/sanity";
import { pageHeroSlidesQuery } from "@/lib/queries";
import { getTicker } from "@/lib/live/ticker";
import type { TickerSnapshot } from "@/lib/live/types";
import type { SanityImage } from "@/types";
import PageHeroSlider from "@/components/sections/PageHeroSlider";
import LiveTicker from "@/components/live/LiveTicker";
import { LiveListSkeleton } from "@/components/live/LiveSkeleton";

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

const TICKER_SKELETON_ROWS = 2;

/** Streams in behind a skeleton: on a cold instance nuLiga needs several seconds to answer. */
async function TickerSection({ meetingId }: { meetingId: string }) {
  const result = await lookup(meetingId);
  if (!result.found) notFound();
  return <LiveTicker meetingId={meetingId} initial={result.snapshot} />;
}

export default async function LiveTickerPage({ params }: PageProps) {
  const { meetingId } = await params;
  // Only the cached hero images are awaited here, so the hero paints immediately.
  const slides = await client
    .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
    .catch(() => [] as SanityImage[]);

  return (
    <>
      <PageHeroSlider slides={slides ?? []} title="Live-Ticker" subtitle="Spielverlauf in Echtzeit" />
      <section className="bg-background dark:bg-gray-900">
        <div className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6">
          <Suspense fallback={<LiveListSkeleton rows={TICKER_SKELETON_ROWS} />}>
            <TickerSection meetingId={meetingId} />
          </Suspense>
          <p className="mt-8 text-center text-sm">
            <Link href="/live" className="font-bold text-brand-red underline-offset-4 hover:underline">
              Alle Live-Spiele
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
