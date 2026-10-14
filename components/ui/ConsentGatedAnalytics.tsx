"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useHasConsent } from "@/lib/consent";

/** Vercel measurement scripts load only after the visitor opted in to "Statistik". */
export default function ConsentGatedAnalytics() {
  if (!useHasConsent("statistics")) return null;
  return (
    <>
      <SpeedInsights />
      <Analytics />
    </>
  );
}
