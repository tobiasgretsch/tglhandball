/**
 * Fixed display time zone for all user-facing dates. Without it, server
 * (UTC on Vercel) and browser (local) format times differently, which causes
 * a hydration mismatch.
 */
export const CLUB_TIME_ZONE = "Europe/Berlin";
