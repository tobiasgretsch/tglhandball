import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const REPORT_URL =
  "https://bhv-handball.liga.nu/cgi-bin/WebObjects/nuLigaDokumentHBDE.woa/wa/nuDokument?dokument=meetingReportHB&meeting=";
const MEETING_ID_PATTERN = /^\d{1,12}$/;
const FETCH_TIMEOUT_MS = 15_000;
const BROWSER_CACHE_SECONDS = 3600;

/** nuLiga answers the first request with a cookie + redirect that must be replayed. */
async function fetchReport(meetingId: string): Promise<Response> {
  const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  const url = `${REPORT_URL}${meetingId}`;
  const first = await fetch(url, { redirect: "manual", signal });
  const location = first.headers.get("location");
  if (first.status < 300 || first.status >= 400 || !location) return first;

  const cookie = first.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  return fetch(new URL(location, url), { headers: { cookie }, signal });
}

/**
 * Same-origin proxy for nuLiga match reports, so the in-page PDF viewer can load
 * them (nuLiga sends no CORS headers). Only numeric meeting IDs are accepted.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ meeting: string }> }) {
  const { meeting } = await params;
  if (!MEETING_ID_PATTERN.test(meeting)) {
    return NextResponse.json({ error: "Invalid meeting id" }, { status: 400 });
  }

  try {
    const upstream = await fetchReport(meeting);
    const isPdf = upstream.headers.get("content-type")?.includes("application/pdf");
    if (!upstream.ok || !isPdf) {
      return NextResponse.json({ error: "Report not available" }, { status: 404 });
    }
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="spielbericht-${meeting}.pdf"`,
        "Cache-Control": `public, max-age=${BROWSER_CACHE_SECONDS}`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Report fetch failed" }, { status: 502 });
  }
}
