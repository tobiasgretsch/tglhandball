"use client";

import type { ReactNode } from "react";
import { openConsentSettings, saveConsent, useConsent, useHasConsent } from "@/lib/consent";

interface ConsentGateProps {
  /** What is being blocked, e.g. "Tabelle von handball.net". */
  label: string;
  /** Provider named in the placeholder so the visitor knows who receives their IP. */
  provider: string;
  children: ReactNode;
  className?: string;
  /** Optional link that works without consent (user-initiated navigation), e.g. open the map on the provider site. */
  fallbackLink?: { href: string; label: string };
}

/** Renders `children` only after opt-in to "Externe Inhalte"; otherwise a click-to-load placeholder. */
export default function ConsentGate({ label, provider, children, className, fallbackLink }: ConsentGateProps) {
  const allowed = useHasConsent("external");
  const consent = useConsent();

  if (allowed) return <>{children}</>;

  const enableExternal = () => {
    saveConsent({
      statistics: consent.status === "decided" ? consent.statistics : false,
      external: true,
    });
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800 ${className ?? ""}`}
    >
      <p className="max-w-md text-sm leading-relaxed text-text dark:text-gray-300">
        <strong>{label}</strong> wird von {provider} bereitgestellt. Beim Laden wird deine IP-Adresse an {provider} übertragen.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={enableExternal}
          className="min-h-11 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep"
        >
          Externe Inhalte erlauben
        </button>
        <button
          type="button"
          onClick={openConsentSettings}
          className="min-h-11 px-3 text-sm text-link underline underline-offset-2"
        >
          Einstellungen
        </button>
      </div>
      {fallbackLink && (
        <a
          href={fallbackLink.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-2 dark:text-accent-sky"
        >
          {fallbackLink.label}
        </a>
      )}
    </div>
  );
}
