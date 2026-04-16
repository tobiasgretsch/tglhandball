"use client";

import { ExternalLink, Trophy, ShoppingBag, Wind, Layers, Shirt } from "lucide-react";

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

/**
 * Opens SHOP_BASE first in a new tab so tengo.de can set its session cookie
 * (first-party), then navigates that same tab to the category URL after the
 * page has had time to load. Direct category links fail without this because
 * the shop requires the base page to be visited first.
 */
function openCategory(categoryHref: string) {
  const shopWindow = window.open(SHOP_BASE, "_blank", "noopener");
  if (!shopWindow) {
    // Popup blocked — fall back to direct link (user may still hit the session issue)
    window.open(categoryHref, "_blank", "noopener");
    return;
  }
  setTimeout(() => {
    if (!shopWindow.closed) {
      shopWindow.location.href = categoryHref;
    }
  }, 1500);
}

export default function FanshopCategories() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {CATEGORIES.map(({ title, description, href, Icon }) => (
        <button
          key={href}
          onClick={() => openCategory(href)}
          className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col text-left cursor-pointer"
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
        </button>
      ))}
    </div>
  );
}
