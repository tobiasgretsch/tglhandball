// ─── Primitives ───────────────────────────────────────────────────────────────

export interface SanityImage {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
  alt?: string;
  hotspot?: { x: number; y: number; height: number; width: number };
}

export interface SanityFile {
  _type: "file";
  asset: {
    _ref: string;
    _type: "reference";
    url?: string;
  };
}

export interface Slug {
  _type: "slug";
  current: string;
}

export interface PortableTextBlock {
  _type: string;
  _key: string;
  [key: string]: unknown;
}

// ─── News ─────────────────────────────────────────────────────────────────────

export type NewsCategory = "herren" | "damen" | "jugend" | "verein";

export interface NewsArticle {
  _id: string;
  title: string;
  slug: Slug;
  publishedAt: string;
  category?: NewsCategory;
  mainImage?: SanityImage;
  teaser?: string;
  body?: PortableTextBlock[];
  author?: string;
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export interface Coach {
  _key: string;
  name: string;
  role?: string;
  image?: SanityImage;
}

export interface Player {
  _key: string;
  number?: number;
  name: string;
  position?: string;
  image?: SanityImage;
}

export interface Team {
  _id: string;
  name: string;
  slug: Slug;
  league?: string;
  headerImage?: SanityImage;
  description?: PortableTextBlock[];
  coaches?: Coach[];
  squad?: Player[];
  order?: number;
}

// ─── Match ────────────────────────────────────────────────────────────────────

export interface Match {
  _id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  result?: string;
  team?: Pick<Team, "_id" | "name" | "slug">;
  venue?: string;
  isHomeGame?: boolean;
}

// ─── Magazine ─────────────────────────────────────────────────────────────────

export interface Magazine {
  _id: string;
  season?: string;
  matchday?: number;
  opponent?: string;
  date?: string;
  pdfFile?: SanityFile;
}

// ─── Partner ──────────────────────────────────────────────────────────────────

export type PartnerTier = "premium" | "standard";

export interface Partner {
  _id: string;
  name: string;
  logo?: SanityImage;
  websiteUrl?: string;
  tier?: PartnerTier;
  isPartnerOfTheDay?: boolean;
  active?: boolean;
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

export type GalleryCategory = "herren" | "damen" | "jugend" | "events";

export interface GalleryItem {
  _id: string;
  image: SanityImage;
  caption?: string;
  category?: GalleryCategory;
  date?: string;
}

// ─── Settings (singleton) ────────────────────────────────────────────────────

export interface Settings {
  clubName?: string;
  logo?: SanityImage;
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  contactEmail?: string;
  venueAddress?: string;
  venueLat?: number;
  venueLng?: number;
}
