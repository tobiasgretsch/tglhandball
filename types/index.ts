// ─── Primitives ───────────────────────────────────────────────────────────────

export interface SanityImage {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
  alt?: string;
  hotspot?: { x: number; y: number; height: number; width: number };
  crop?: { top: number; bottom: number; left: number; right: number };
  lqip?: string; // base64 data URL from Sanity asset metadata — used for blur placeholder
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

export type TeamCategory = "herren" | "damen" | "jugend_m" | "jugend_w";

export interface TicketPriceRow {
  _key: string;
  label: string;
  normalPrice?: string;
  discountedPrice?: string;
}

export interface PricingSection {
  heading?: string;
  rows?: TicketPriceRow[];
  footnote?: string;
  infoBox?: string;
}

export interface Coach {
  _key: string;
  name: string;
  role?: string;
  image?: SanityImage;
  /** Second photo, shown on the flipped side of the card. */
  imageBack?: SanityImage;
}

export interface Betreuer {
  _key: string;
  name: string;
  role?: string;
  image?: SanityImage;
  /** Second photo, shown on the flipped side of the card. */
  imageBack?: SanityImage;
}

export interface Player {
  _key: string;
  number?: number;
  name: string;
  position?: string;
  image?: SanityImage;
  /** Second photo, shown on the flipped side of the card. */
  imageBack?: SanityImage;
}

export type TrainingDay = "mo" | "di" | "mi" | "do" | "fr" | "sa" | "so";

export interface TrainingTime {
  _key: string;
  day: TrainingDay;
  /** "HH:MM" */
  startTime: string;
  endTime?: string;
  location?: string;
  note?: string;
}

export interface Team {
  _id: string;
  name: string;
  slug: Slug;
  league?: string;
  category?: TeamCategory;
  headerImage?: SanityImage;
  description?: PortableTextBlock[];
  coaches?: Coach[];
  betreuer?: Betreuer[];
  squad?: Player[];
  trainingTimes?: TrainingTime[];
  pricingSection?: PricingSection;
  nuligaTableUrl?: string;
  order?: number;
}

// ─── Match ────────────────────────────────────────────────────────────────────

export interface Match {
  _id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  result?: string;
  /** nuLiga meeting id — present when a PDF match report is available. */
  meetingId?: string;
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

export type PartnerTier =
  | "hauptsponsor"
  | "exclusiv_hallenname"
  | "premium"
  | "standard"
  | "fitness_partner"
  | "supporter_club";

export interface Partner {
  _id: string;
  name: string;
  description?: string;
  logo?: SanityImage;
  /** Light/white logo — render it on a dark plate instead of white. */
  logoOnDark?: boolean;
  websiteUrl?: string;
  tier?: PartnerTier;
  isPartnerOfTheDay?: boolean;
  active?: boolean;
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

export interface GalleryItem {
  _id: string;
  image: SanityImage;
  caption?: string;
  date?: string;
  /** Untagged photos belong to the club ("Verein"). */
  team?: Pick<Team, "_id" | "name" | "slug">;
}

// ─── Settings (singleton) ────────────────────────────────────────────────────

export interface BoardMember {
  _key: string;
  name: string;
  role?: string;
  email?: string;
  photo?: SanityImage;
}

export interface ClubLocation {
  _key: string;
  name: string;
  label?: string;
  address?: string;
  /** GROQ yields null for unset fields; without coordinates only the address card is shown. */
  lat?: number | null;
  lng?: number | null;
}

export interface Settings {
  clubName?: string;
  logo?: SanityImage;
  favicon?: SanityImage;
  heroImage?: SanityImage;
  pageHeroSlides?: SanityImage[];
  aboutText?: PortableTextBlock[];
  aboutPhoto?: SanityImage;
  boardMembers?: BoardMember[];
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  contactEmail?: string;
  venueName?: string;
  venueAddress?: string;
  venueLat?: number;
  venueLng?: number;
  locations?: ClubLocation[];
  partnerPageText?: PortableTextBlock[];
  partnerInfoPdf?: SanityFile;
}
