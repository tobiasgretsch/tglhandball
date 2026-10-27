import { ImageResponse } from "next/og";

export const alt = "TG MIPA Landshut Handball";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CLUB_RED = "#da251c";
const CLUB_BLUE = "#004f9f";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 80,
          background: CLUB_BLUE,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            background: CLUB_RED,
            padding: "8px 28px",
            fontSize: 36,
            fontWeight: 800,
            fontStyle: "italic",
            textTransform: "uppercase",
          }}
        >
          TG MIPA Landshut
        </div>
        <div style={{ display: "flex", fontSize: 120, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", marginTop: 24 }}>
          Handball in Landshut
        </div>
        <div style={{ display: "flex", fontSize: 36, marginTop: 16, opacity: 0.85 }}>
          Spielplan · Ergebnisse · Teams · News
        </div>
      </div>
    ),
    size,
  );
}
