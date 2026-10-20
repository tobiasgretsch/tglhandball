import { groq } from "next-sanity";

// ─── News ────────────────────────────────────────────────────────────────────

export const allNewsQuery = groq`
  *[_type == "news"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt,
    category,
    mainImage { ..., "lqip": asset->metadata.lqip },
    teaser,
    author,
  }
`;

export const newsDetailQuery = groq`
  *[_type == "news" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    publishedAt,
    category,
    mainImage { ..., "lqip": asset->metadata.lqip },
    teaser,
    body,
    author,
  }
`;

// ─── Teams ───────────────────────────────────────────────────────────────────

export const allTeamsQuery = groq`
  *[_type == "team"] | order(order asc) {
    _id,
    name,
    slug,
    league,
    category,
    headerImage { ..., "lqip": asset->metadata.lqip },
    order,
  }
`;

export const teamDetailQuery = groq`
  *[_type == "team" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    league,
    headerImage { ..., "lqip": asset->metadata.lqip },
    description,
    coaches[] {
      _key,
      name,
      role,
      image { ..., "lqip": asset->metadata.lqip },
      imageBack { ..., "lqip": asset->metadata.lqip },
    },
    betreuer[] {
      _key,
      name,
      role,
      image { ..., "lqip": asset->metadata.lqip },
      imageBack { ..., "lqip": asset->metadata.lqip },
    },
    squad[] {
      _key,
      name,
      number,
      position,
      image { ..., "lqip": asset->metadata.lqip },
      imageBack { ..., "lqip": asset->metadata.lqip },
    },
    trainingTimes,
    pricingSection {
      heading,
      rows[] {
        _key,
        label,
        normalPrice,
        discountedPrice,
      },
      footnote,
      infoBox,
    },
    nuligaTableUrl,
  }
`;

// ─── Matches (Spielplan) ─────────────────────────────────────────────────────

export const spielplanQuery = groq`
  *[_type == "match"] | order(date asc) {
    _id,
    date,
    homeTeam,
    awayTeam,
    result,
    meetingId,
    team->{ _id, name, slug },
    venue,
    isHomeGame,
  }
`;

// ─── Spieltagshefte (Magazines) ───────────────────────────────────────────────

export const allMagazinesQuery = groq`
  *[_type == "magazine"] | order(date desc) {
    _id,
    season,
    matchday,
    opponent,
    date,
    pdfFile { asset->{ url } },
  }
`;

// ─── Partner ─────────────────────────────────────────────────────────────────

export const activePartnersQuery = groq`
  *[_type == "partner" && active == true] | order(tier asc, name asc) {
    _id,
    name,
    description,
    logo,
    logoOnDark,
    websiteUrl,
    tier,
    isPartnerOfTheDay,
  }
`;

export const partnerOfTheDayQuery = groq`
  *[_type == "partner" && isPartnerOfTheDay == true && active == true][0] {
    _id,
    name,
    logo,
    websiteUrl,
  }
`;

// ─── Gallery ─────────────────────────────────────────────────────────────────

export const allGalleryQuery = groq`
  *[_type == "gallery"] | order(date desc) {
    _id,
    image,
    caption,
    date,
    "team": team->{ _id, name, slug },
  }
`;

/** Latest photos tagged with one team — the row on the team page. */
export const teamGalleryQuery = groq`
  *[_type == "gallery" && team._ref == $teamId] | order(date desc) [0...12] {
    _id,
    image,
    caption,
  }
`;

/** Latest club photos (not tagged with a team) — the row on the Über-uns page. */
export const clubGalleryQuery = groq`
  *[_type == "gallery" && !defined(team)] | order(date desc) [0...12] {
    _id,
    image,
    caption,
  }
`;

// ─── Related news (excludes current article) ─────────────────────────────────

export const relatedNewsQuery = groq`
  *[_type == "news" && slug.current != $currentSlug] | order(publishedAt desc) [0...3] {
    _id,
    title,
    slug,
    publishedAt,
    category,
    mainImage { ..., "lqip": asset->metadata.lqip },
    teaser,
  }
`;

// ─── Homepage queries ─────────────────────────────────────────────────────────

/** The club's flagship men's team: first "herren" team in the Studio ordering. */
const FLAGSHIP_TEAM_ID = `(*[_type == "team" && category == "herren"] | order(order asc)[0]._id)`;

export const homeUpcomingMatchesQuery = groq`
  *[_type == "match" && team._ref == ${FLAGSHIP_TEAM_ID} && date > $now && !defined(result)] | order(date asc) [0...2] {
    _id,
    date,
    homeTeam,
    awayTeam,
    venue,
    isHomeGame,
    team->{ _id, name, slug },
  }
`;

export const latestResultQuery = groq`
  *[_type == "match" && team._ref == ${FLAGSHIP_TEAM_ID} && defined(result)] | order(date desc) [0] {
    _id,
    date,
    homeTeam,
    awayTeam,
    result,
    meetingId,
    venue,
    isHomeGame,
    team->{ _id, name, slug },
  }
`;

export const latestNewsQuery = groq`
  *[_type == "news"] | order(publishedAt desc) [0...4] {
    _id,
    title,
    slug,
    publishedAt,
    category,
    mainImage { ..., "lqip": asset->metadata.lqip },
    teaser,
    author,
  }
`;

/** Returns the next upcoming magazine (date >= today) that has a PDF attached. */
export const homeMagazineQuery = groq`
  *[_type == "magazine" && date >= $today && defined(pdfFile.asset)] | order(date asc) [0] {
    _id,
    season,
    matchday,
    opponent,
    date,
    pdfFile { asset->{ url } },
  }
`;

// ─── Team-specific match queries ─────────────────────────────────────────────

export const teamUpcomingMatchesQuery = groq`
  *[_type == "match" && team._ref == $teamId && date > $now && !defined(result)]
  | order(date asc) [0...10] {
    _id,
    date,
    homeTeam,
    awayTeam,
    venue,
    isHomeGame,
  }
`;

export const teamRecentResultsQuery = groq`
  *[_type == "match" && team._ref == $teamId && defined(result)]
  | order(date desc) [0...10] {
    _id,
    date,
    homeTeam,
    awayTeam,
    result,
    meetingId,
    isHomeGame,
  }
`;

// ─── Top sponsors (homepage section: Hauptsponsor + Exclusiv-Partner) ─────────

export const topSponsorsQuery = groq`
  *[_type == "partner" && active == true && tier in ["hauptsponsor", "exclusiv_hallenname"]]
  | order(tier asc, name asc) {
    _id,
    name,
    logo,
    websiteUrl,
    tier,
  }
`;

// ─── Premium Partners (footer strip) ─────────────────────────────────────────

export const premiumPartnersQuery = groq`
  *[_type == "partner" && active == true && tier == "premium"] | order(name asc) {
    _id,
    name,
    logo,
    websiteUrl,
  }
`;

export const standardPartnersQuery = groq`
  *[_type == "partner" && active == true && tier == "standard"] | order(name asc) {
    _id,
    name,
    logo,
    websiteUrl,
  }
`;

// ─── Partner page settings ───────────────────────────────────────────────────

export const partnerPageSettingsQuery = groq`
  *[_type == "settings"][0] {
    partnerPageText,
    partnerInfoPdf { asset->{ url } },
  }
`;

// ─── Settings (singleton) ────────────────────────────────────────────────────

/** Fetches only the page-header slider images — used by pages that don't need full settings. */
export const pageHeroSlidesQuery = groq`
  *[_type == "settings"][0].pageHeroSlides[] { ..., "lqip": asset->metadata.lqip }
`;

export const settingsQuery = groq`
  *[_type == "settings"][0] {
    clubName,
    logo,
    favicon,
    heroImage { ..., "lqip": asset->metadata.lqip },
    pageHeroSlides[] { ..., "lqip": asset->metadata.lqip },
    aboutText,
    aboutPhoto,
    boardMembers[] {
      _key,
      name,
      role,
      email,
      photo,
    },
    instagramUrl,
    facebookUrl,
    youtubeUrl,
    tiktokUrl,
    contactEmail,
    venueName,
    venueAddress,
    venueLat,
    venueLng,
  }
`;
