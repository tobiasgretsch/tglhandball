export interface SanityImage {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
  alt?: string;
}

export interface Slug {
  _type: "slug";
  current: string;
}

export interface NewsArticle {
  _id: string;
  title: string;
  slug: Slug;
  publishedAt: string;
  excerpt?: string;
  mainImage?: SanityImage;
  body?: PortableTextBlock[];
}

export interface Team {
  _id: string;
  name: string;
  slug: Slug;
  league?: string;
  image?: SanityImage;
  players?: Player[];
}

export interface Player {
  _id: string;
  name: string;
  position?: string;
  number?: number;
  image?: SanityImage;
}

export interface Game {
  _id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  venue?: string;
  competition?: string;
  team?: Pick<Team, "_id" | "name">;
}

// Portable Text block type (used for rich text from Sanity)
export interface PortableTextBlock {
  _type: string;
  _key: string;
  [key: string]: unknown;
}
