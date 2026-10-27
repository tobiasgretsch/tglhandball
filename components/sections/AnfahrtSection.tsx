"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ClubLocation } from "@/types";
import ConsentGate from "@/components/ui/ConsentGate";
import FilterPill from "@/components/ui/FilterPill";
import VenueMap from "@/components/sections/VenueMap";

interface Coordinates {
  lat: number;
  lng: number;
}

const getCoordinates = ({ lat, lng }: ClubLocation): Coordinates | null =>
  lat != null && lng != null ? { lat, lng } : null;

const googleMapsUrl = ({ lat, lng }: Coordinates) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

const googleRouteUrl = (location: ClubLocation, coords: Coordinates | null) => {
  const destination = coords
    ? `${coords.lat},${coords.lng}`
    : [location.name, location.address].filter(Boolean).join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
};

interface AnfahrtSectionProps {
  locations: ClubLocation[];
}

/** Location picker (game hall, training halls …) with address card and a map for the selected one. */
export default function AnfahrtSection({ locations }: AnfahrtSectionProps) {
  const t = useTranslations("anfahrtSection");
  const [selectedKey, setSelectedKey] = useState(locations[0]?._key);
  const selected = locations.find((l) => l._key === selectedKey) ?? locations[0];
  if (!selected) return null;
  const coords = getCoordinates(selected);

  return (
    <>
      {locations.length > 1 && (
        <div className="mt-8 flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t("chooseLocation")}>
          {locations.map((location) => (
            <FilterPill
              key={location._key}
              label={location.name}
              active={location._key === selected._key}
              onClick={() => setSelectedKey(location._key)}
            />
          ))}
        </div>
      )}

      <div className={`mt-8 grid gap-8 lg:gap-12 items-start ${coords ? "lg:grid-cols-[1fr_2fr]" : "max-w-md"}`}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_16px_40px_-16px_rgb(0_0_0/0.2)] p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={15} className="text-brand-red" />
            </div>
            <div className="min-w-0">
              {selected.label && (
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{selected.label}</p>
              )}
              <p className="font-black text-text dark:text-gray-100 text-base leading-tight break-words">
                {selected.name}
              </p>
              {selected.address && (
                <p className="text-muted text-sm mt-1 whitespace-pre-line leading-relaxed">{selected.address}</p>
              )}
            </div>
          </div>

          <a
            href={googleRouteUrl(selected, coords)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-accent dark:text-accent-sky hover:text-primary transition-colors"
          >
            {t("route")}
          </a>
        </div>

        {coords && (
        <ConsentGate
          label={t("mapLabel")}
          provider="OpenStreetMap"
          className="h-[400px] md:h-[460px]"
          fallbackLink={{ href: googleMapsUrl(coords), label: t("openInGoogleMaps") }}
        >
          {/* key remounts the map: Leaflet reads center/zoom only on creation */}
          <VenueMap
            key={selected._key}
            lat={coords.lat}
            lng={coords.lng}
            venueName={selected.name}
            venueAddress={selected.address}
          />
        </ConsentGate>
        )}
      </div>
    </>
  );
}
