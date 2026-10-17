import { isValidLogoId } from "@/lib/live/parse";
import { fetchLogo } from "@/lib/live/upstream";

const LOGO_CACHE_HEADER = "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400";
const NOT_FOUND_CACHE_HEADER = "public, s-maxage=300";

/** Same-origin proxy for nuLiga club logos, so the ticker never hotlinks the live backend. */
export async function GET(_request: Request, { params }: { params: Promise<{ logoId: string }> }) {
  const { logoId } = await params;
  if (!isValidLogoId(logoId)) return new Response(null, { status: 404 });
  try {
    const logo = await fetchLogo(logoId);
    if (!logo) return new Response(null, { status: 404, headers: { "Cache-Control": NOT_FOUND_CACHE_HEADER } });
    return new Response(logo.body, {
      headers: { "Content-Type": logo.contentType, "Cache-Control": LOGO_CACHE_HEADER },
    });
  } catch (error) {
    console.error("[live] logo", logoId, error instanceof Error ? error.message : error);
    return new Response(null, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
