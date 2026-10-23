import { after, NextResponse } from "next/server";
import { archiveQuietly } from "@/lib/live/archiveWrite";
import { getTicker } from "@/lib/live/ticker";

export const dynamic = "force-dynamic";
/** A cold cache reads every club group once (~60 requests). */
export const maxDuration = 30;

const CACHE_HEADER = "public, s-maxage=4, stale-while-revalidate=8";
const NOT_FOUND_CACHE_HEADER = "public, s-maxage=30";
const NO_CACHE = { "Cache-Control": "no-store" };

export async function GET(_request: Request, { params }: { params: Promise<{ meetingId: string }> }) {
  const { meetingId } = await params;
  try {
    const result = await getTicker(meetingId);
    if (!result) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404, headers: { "Cache-Control": NOT_FOUND_CACHE_HEADER } },
      );
    }
    // The final whistle is in: keep the game for good (idempotent, runs after the response is sent).
    if (result.snapshot.status === "finished" && !result.stale) after(() => archiveQuietly(meetingId));
    return NextResponse.json(
      { ...result.snapshot, stale: result.stale },
      { headers: { "Cache-Control": result.stale ? "no-store" : CACHE_HEADER } },
    );
  } catch (error) {
    console.error("[live]", meetingId, error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Live data unavailable" }, { status: 502, headers: NO_CACHE });
  }
}
