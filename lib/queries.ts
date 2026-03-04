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
    squad,
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
    pdfFile,
  }
`;

export const magazinesBySeasonQuery = groq`
  *[_type == "magazine" && season == $season] | order(matchday asc) {
    _id,
    season,
    matchday,
    opponent,
    date,
    pdfFile,
  }
`;

// ─── Partner ─────────────────────────────────────────────────────────────────

export const activePartnersQuery = groq`
  *[_type == "partner" && active == true] | order(tier asc, name asc) {
    _id,
    name,
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

// ─── Settings (singleton) ────────────────────────────────────────────────────

export const settingsQuery = groq`
  *[_type == "settings"][0] {
    clubName,
    logo,
    instagramUrl,
    facebookUrl,
    youtubeUrl,
    contactEmail,
    venueAddress,
    venueLat,
    venueLng,
  }
`;
