import { groq } from "next-sanity";

// ─── News ────────────────────────────────────────────────────────────────────

export const allNewsQuery = groq`
  *[_type == "news"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt,
    category,
    mainImage,
    teaser,
    author,
  }
`;

export const newsByCategoryQuery = groq`
  *[_type == "news" && category == $category] | order(publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt,
    category,
    mainImage,
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
    mainImage,
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
    headerImage,
    order,
  }
`;

export const teamDetailQuery = groq`
  *[_type == "team" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    league,
    headerImage,
    description,
    coaches,
    betreuer,
    squad,
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
    team->{ _id, name, slug },
    venue,
    isHomeGame,
  }
`;

export const spielplanByTeamQuery = groq`
  *[_type == "match" && team._ref == $teamId] | order(date asc) {
    _id,
    date,
    homeTeam,
    awayTeam,
    result,
    team->{ _id, name, slug },
    venue,
    isHomeGame,
  }
`;

export const upcomingMatchesQuery = groq`
  *[_type == "match" && date > $now && !defined(result)] | order(date asc) {
    _id,
    date,
    homeTeam,
    awayTeam,
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

export const magazinesBySeasonQuery = groq`
  *[_type == "magazine" && season == $season] | order(matchday asc) {
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
    category,
    date,
  }
`;

export const galleryByCategoryQuery = groq`
  *[_type == "gallery" && category == $category] | order(date desc) {
    _id,
    image,
    caption,
    category,
    date,
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
    mainImage,
    teaser,
  }
`;

// ─── Homepage queries ─────────────────────────────────────────────────────────

export const homeUpcomingMatchesQuery = groq`
  *[_type == "match" && date > $now && !defined(result)] | order(date asc) [0...2] {
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
  *[_type == "match" && defined(result)] | order(date desc) [0] {
    _id,
    date,
    homeTeam,
    awayTeam,
    result,
    venue,
    isHomeGame,
    team->{ _id, name, slug },
  }
`;

export const latestNewsQuery = groq`
  *[_type == "news"] | order(publishedAt desc) [0...3] {
    _id,
    title,
    slug,
    publishedAt,
    category,
    mainImage,
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
  | order(date asc) [0...5] {
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
  | order(date desc) [0...5] {
    _id,
    date,
    homeTeam,
    awayTeam,
    result,
    isHomeGame,
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

// ─── Settings (singleton) ────────────────────────────────────────────────────

/** Fetches only the page-header slider images — used by pages that don't need full settings. */
export const pageHeroSlidesQuery = groq`
  *[_type == "settings"][0].pageHeroSlides
`;

export const settingsQuery = groq`
  *[_type == "settings"][0] {
    clubName,
    logo,
    favicon,
    heroImage,
    pageHeroSlides,
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
