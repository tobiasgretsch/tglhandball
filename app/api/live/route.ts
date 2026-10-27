import { after, NextResponse } from "next/server";
import { archiveFinishedSoon } from "@/lib/live/archiveWrite";
import { getLiveSummary } from "@/lib/live/schedule";

export const dynamic = "force-dynamic";
/** A cold cache reads every club group once (~60 requests). */
export const maxDuration = 15;

/** One cached answer is shared by all visitors, so nuLiga sees a few requests per minute at most. */
const CACHE_HEADER = "public, s-maxage=10, stale-while-revalidate=20";
const NO_CACHE = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const summary = await getLiveSummary();
    // Every visitor polls this, so a finished game is archived (and shows up as a result) without anyone opening it.
    after(() => archiveFinishedSoon(summary.games));
    return NextResponse.json(summary, { headers: { "Cache-Control": CACHE_HEADER } });
  } catch (error) {
    console.error("[live]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Live data unavailable" }, { status: 502, headers: NO_CACHE });
  }
}
