import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { archiveRecentGames } from "@/lib/live/archiveWrite";
import { syncMatches } from "@/lib/nuliga/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron target. Vercel sends `Authorization: Bearer <CRON_SECRET>`;
 * the same header lets you trigger a sync manually with curl.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await syncMatches();
    if (summary.created + summary.updated > 0) {
      revalidatePath("/");
      revalidatePath("/spielplan");
      revalidatePath("/teams/[slug]", "page");
    }
    // A failed sweep must not hide a successful sync, so it reports its own error.
    const archive = await archiveRecentGames().catch((error: unknown) => {
      console.error("[archive-sweep]", error instanceof Error ? error.message : error);
      return { error: "Archive sweep failed" };
    });
    return NextResponse.json({ ...summary, archive });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    console.error("[sync-matches]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
