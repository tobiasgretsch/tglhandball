import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTicker } from "@/lib/live/ticker";
import type { TickerSnapshot } from "@/lib/live/types";
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
  // No hero image: on a phone the score has to be the first thing on screen.
  return (
    <section className="bg-background dark:bg-gray-900">
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-20 sm:px-6 lg:pt-24">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-bold uppercase italic tracking-[-0.02em] text-text dark:text-gray-100">
            Live-Ticker
          </h1>
          <Link
            href="/live"
            className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-brand-red underline-offset-4 hover:underline"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Alle Live-Spiele
          </Link>
        </div>
        <Suspense fallback={<LiveListSkeleton rows={TICKER_SKELETON_ROWS} />}>
          <TickerSection meetingId={meetingId} />
        </Suspense>
      </div>
    </section>
  );
}
