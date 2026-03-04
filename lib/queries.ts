import { groq } from "next-sanity";

export const allNewsQuery = groq`
  *[_type == "news"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    mainImage,
  }
`;

export const newsDetailQuery = groq`
  *[_type == "news" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    mainImage,
    body,
  }
`;

export const allTeamsQuery = groq`
  *[_type == "team"] | order(order asc) {
    _id,
    name,
    slug,
    league,
    image,
  }
`;

export const teamDetailQuery = groq`
  *[_type == "team" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    league,
    image,
    players[]->{
      _id,
      name,
      position,
      number,
      image,
    },
  }
`;

export const spielplanQuery = groq`
  *[_type == "game"] | order(date asc) {
    _id,
    date,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    venue,
    competition,
    team->{
      _id,
      name,
    },
  }
`;
