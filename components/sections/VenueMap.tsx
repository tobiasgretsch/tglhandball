"use client";

// VenueMapContent is dynamically imported with ssr:false because leaflet accesses
// window during module initialisation, which fails during server-side rendering.
import dynamic from "next/dynamic";

const VenueMapContent = dynamic(() => import("./VenueMapContent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
      <span className="text-muted text-sm">Karte wird geladen …</span>
    </div>
  ),
});

interface VenueMapProps {
  lat: number;
  lng: number;
  venueName?: string;
  venueAddress?: string;
}

export default function VenueMap(props: VenueMapProps) {
  return (
    <div className="w-full h-[400px] md:h-[460px] rounded-xl overflow-hidden border border-gray-100 shadow-sm">
      <VenueMapContent {...props} />
    </div>
  );
}
