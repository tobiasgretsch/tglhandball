import type { Metadata } from "next";
import { client } from "@/lib/sanity";
import { pageHeroSlidesQuery } from "@/lib/queries";
import type { SanityImage } from "@/types";
import PageHeroSlider from "@/components/sections/PageHeroSlider";
import { ExternalLink, Trophy, ShoppingBag, Wind, Layers, Shirt, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Fanshop",
  description:
    "Offizieller Fanshop des TG MIPA Landshut — Trikots, Shirts, Jacken, Hosen und mehr.",
  openGraph: {
    title: "Fanshop | TG MIPA Landshut",
    description: "Offizieller Fanshop des TG MIPA Landshut — zeig deine Vereinsfarben.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const revalidate = 3600;

const SHOP_BASE = "https://tengo.de/webshop/TG-Landshut-1861-eV";

const CATEGORIES = [
  {
    title: "TGL Vereinskollektion",
    description: "Offizielle Trikots und exklusive Vereinskleidung — zeig deine Vereinsfarben auf und neben dem Platz.",
    href: "https://tengo.de/webshop/TGL-Vereinskollektion",
    Icon: Trophy,
  },
  {
    title: "Tops, Shirts & Hoodies",
    description: "Shirts, Polos und Hoodies mit Vereinslogo — perfekt für Training und Freizeit.",
    href: "https://tengo.de/webshop/Tops-Shirts-Hoodies",
    Icon: Shirt,
  },
  {
    title: "Hosen & Shorts",
    description: "Sporthosen und Shorts für Training und Wettkampf — bequem und funktionell.",
    href: "https://tengo.de/webshop/Hosen-Shorts",
    Icon: Layers,
  },
  {
    title: "Jacken, Westen & Regen",
    description: "Wetterfeste Jacken, Westen und Regenbekleidung für jede Witterung.",
    href: "https://tengo.de/webshop/Jacken-Westen-Regenbekleidung",
    Icon: Wind,
  },
  {
    title: "Taschen & Rucksäcke",
    description: "Sporttaschen und Rucksäcke im Vereinsdesign — praktisch und stilvoll.",
    href: "https://tengo.de/webshop/Taschen-Rucksaecke",
    Icon: ShoppingBag,
  },
] as const;

export default async function FanshopPage() {
  const slides = await client
    .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
    .catch(() => [] as SanityImage[]);

  return (
    <>
      <PageHeroSlider slides={slides ?? []}>
        <span className="absolute right-6 bottom-0 text-[120px] md:text-[200px] font-black text-white/5 leading-none select-none pointer-events-none">
          SHOP
        </span>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-[132px] lg:pt-[140px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/50 mb-3">
            TG MIPA Landshut
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight">
            Fanshop
          </h1>
          <p className="text-white/55 mt-3 text-base max-w-lg">
            Trikots, Shirts, Jacken und mehr — alles mit Vereinsfarben.
          </p>
        </div>
      </PageHeroSlider>

      <div className="bg-background dark:bg-gray-900 min-h-[60vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">

          {/* Category grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CATEGORIES.map(({ title, description, href, Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
              >
                {/* Top accent bar */}
                <div className="h-1 bg-primary" />

                <div className="p-5 flex flex-col flex-1">
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4 shrink-0">
                    <Icon size={22} className="text-primary" />
                  </div>

                  {/* Text */}
                  <h2 className="font-black text-text dark:text-gray-100 text-base leading-snug mb-2">
                    {title}
                  </h2>
                  <p className="text-muted dark:text-gray-400 text-sm leading-relaxed flex-1">
                    {description}
                  </p>

                  {/* CTA */}
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-primary group-hover:text-primary-light transition-colors mt-5">
                    Jetzt shoppen
                    <ExternalLink size={11} />
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* Full shop CTA */}
          <div className="mt-8 rounded-xl bg-primary px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60 mb-1">
                Gesamter Shop
              </p>
              <p className="font-black text-white text-base leading-tight">
                Alle Artikel auf einen Blick
              </p>
            </div>
            <a
              href={SHOP_BASE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary font-bold uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:bg-white/90 transition-colors shrink-0 whitespace-nowrap"
            >
              Zum Fanshop
              <ArrowRight size={13} />
            </a>
          </div>

        </div>
      </div>
    </>
  );
}
