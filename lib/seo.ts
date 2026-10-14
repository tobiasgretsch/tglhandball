import type { Match, Settings } from "@/types";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://tglhandball.de").replace(/\/$/, "");
export const CLUB_NAME = "TG MIPA Landshut";
export const CLUB_DESCRIPTION =
  "Handballverein aus Landshut mit Herren-, Damen- und Jugendmannschaften. Spielplan, Ergebnisse, News und Hallenadresse.";

const MAX_STRUCTURED_MATCHES = 40;
const DEFAULT_MATCH_DURATION_MS = 90 * 60 * 1000;

type JsonLd = Record<string, unknown>;

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Splits "Straße 7\n84034 Landshut" into a schema.org PostalAddress. */
export function toPostalAddress(rawAddress: string): JsonLd {
  const [street, cityLine = ""] = rawAddress.split("\n").map((line) => line.trim());
  const [, postalCode, city] = cityLine.match(/^(\d{5})\s+(.+)$/) ?? [];
  return {
    "@type": "PostalAddress",
    streetAddress: street,
    ...(postalCode && { postalCode }),
    addressLocality: city ?? "Landshut",
    addressCountry: "DE",
  };
}

export function venuePlace(settings: Settings | null): JsonLd | null {
  if (!settings?.venueName || !settings.venueAddress) return null;
  return {
    "@type": "SportsActivityLocation",
    name: settings.venueName,
    address: toPostalAddress(settings.venueAddress),
    ...(settings.venueLat != null &&
      settings.venueLng != null && {
        geo: { "@type": "GeoCoordinates", latitude: settings.venueLat, longitude: settings.venueLng },
      }),
  };
}

export function organizationJsonLd(settings: Settings | null, logoUrl: string | null): JsonLd[] {
  const organization: JsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "@id": `${SITE_URL}/#organization`,
    name: settings?.clubName ?? CLUB_NAME,
    alternateName: ["TG MIPA Landshut Handball", "TGL Handball"],
    description: CLUB_DESCRIPTION,
    url: SITE_URL,
    sport: "Handball",
    areaServed: "Landshut",
    ...(logoUrl && { logo: logoUrl, image: logoUrl }),
    sameAs: [settings?.instagramUrl, settings?.facebookUrl, settings?.youtubeUrl].filter(Boolean),
    ...(settings?.contactEmail && { email: settings.contactEmail }),
    ...(venuePlace(settings) && { location: venuePlace(settings) }),
  };

  const website: JsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "TG MIPA Landshut Handball",
    inLanguage: "de-DE",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };

  return [organization, website];
}

export function breadcrumbJsonLd(trail: Array<{ name: string; path: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function newsArticleJsonLd(article: {
  title: string;
  path: string;
  teaser?: string;
  publishedAt: string;
  author?: string;
  imageUrl?: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    mainEntityOfPage: absoluteUrl(article.path),
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    inLanguage: "de-DE",
    ...(article.teaser && { description: article.teaser }),
    ...(article.imageUrl && { image: [article.imageUrl] }),
    author: article.author
      ? { "@type": "Person", name: article.author }
      : { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function sportsTeamJsonLd(team: { name: string; path: string; league?: string; imageUrl?: string }): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: team.name,
    url: absoluteUrl(team.path),
    sport: "Handball",
    ...(team.league && { description: `${team.name} – ${team.league}` }),
    ...(team.imageUrl && { image: team.imageUrl }),
    memberOf: { "@id": `${SITE_URL}/#organization` },
  };
}

function matchJsonLd(match: Match, settings: Settings | null): JsonLd {
  const start = new Date(match.date);
  const homeVenue = venuePlace(settings);
  const location = match.isHomeGame && homeVenue
    ? homeVenue
    : match.venue
      ? { "@type": "Place", name: match.venue }
      : undefined;

  return {
    "@type": "SportsEvent",
    name: `${match.homeTeam} – ${match.awayTeam}`,
    sport: "Handball",
    startDate: start.toISOString(),
    endDate: new Date(start.getTime() + DEFAULT_MATCH_DURATION_MS).toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    homeTeam: { "@type": "SportsTeam", name: match.homeTeam },
    awayTeam: { "@type": "SportsTeam", name: match.awayTeam },
    ...(location && { location }),
    ...(match.result && { description: `Endergebnis: ${match.result}` }),
  };
}

/** Upcoming fixtures first, then the most recent results, capped to keep pages light. */
export function fixturesJsonLd(matches: Match[], settings: Settings | null): JsonLd | null {
  const now = Date.now();
  const time = (match: Match) => new Date(match.date).getTime();
  const upcoming = matches.filter((m) => time(m) >= now).sort((a, b) => time(a) - time(b));
  const past = matches.filter((m) => time(m) < now).sort((a, b) => time(b) - time(a));
  const selected = [...upcoming, ...past].slice(0, MAX_STRUCTURED_MATCHES);
  if (selected.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Spielplan & Ergebnisse TG MIPA Landshut",
    itemListElement: selected.map((match, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: matchJsonLd(match, settings),
    })),
  };
}

/** Default share image for pages without their own; served by app/og/route.tsx. */
export const DEFAULT_OG_IMAGE = {
  url: "/og",
  width: 1200,
  height: 630,
  alt: "TG MIPA Landshut Handball",
} as const;
