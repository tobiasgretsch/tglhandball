import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { syncMatches } from "@/lib/nuliga/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    console.error("[sync-matches]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
