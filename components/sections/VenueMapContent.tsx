// Leaflet CSS must be imported in the file that uses react-leaflet components.
// This module is only ever loaded client-side (via dynamic with ssr:false in VenueMap.tsx).
import "leaflet/dist/leaflet.css";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// ─── Custom club-colour pin marker ────────────────────────────────────────────

const PIN_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 5.476 2.762 10.308 6.978 13.228L16 44l9.022-14.772C29.238 26.308 32 21.476 32 16 32 7.163 24.837 0 16 0z" fill="#004f9f"/>
    <circle cx="16" cy="16" r="7" fill="white"/>
  </svg>
`;

const clubIcon = L.divIcon({
  html: PIN_SVG,
  iconSize: [32, 44],
  iconAnchor: [16, 44],
  popupAnchor: [0, -46],
  className: "",
});

// ─── Component ────────────────────────────────────────────────────────────────

interface VenueMapContentProps {
  lat: number;
  lng: number;
  venueName?: string;
  venueAddress?: string;
}

export default function VenueMapContent({
  lat,
  lng,
  venueName,
  venueAddress,
}: VenueMapContentProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={clubIcon}>
        {(venueName || venueAddress) && (
          <Popup>
            {venueName && (
              <strong className="block font-bold text-sm">{venueName}</strong>
            )}
            {venueAddress && (
              <span className="text-xs text-gray-600 whitespace-pre-line">
                {venueAddress}
              </span>
            )}
          </Popup>
        )}
      </Marker>
    </MapContainer>
  );
}
