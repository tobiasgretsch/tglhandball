import type { Metadata, Viewport } from "next";
import StudioClient from "./_studio-client";

export const metadata: Metadata = {
  title: "Sanity Studio – TGL MIPA",
  robots: { index: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function StudioPage() {
  return <StudioClient />;
}
