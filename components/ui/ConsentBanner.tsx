"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONSENT_ALL,
  CONSENT_NONE,
  OPEN_SETTINGS_EVENT,
  saveConsent,
  useConsent,
  type ConsentChoices,
} from "@/lib/consent";

const FOCUSABLE = "button, a[href], input:not([disabled])";
const BUTTON_CLASS =
  "min-h-11 flex-1 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-deep focus-visible:outline-2 focus-visible:outline-offset-2";

interface CategoryRowProps {
  title: string;
  description: string;
  checked: boolean;
  locked?: boolean;
  onChange?: (value: boolean) => void;
}

function CategoryRow({ title, description, checked, locked, onChange }: CategoryRowProps) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <input
        type="checkbox"
        checked={checked}
        disabled={locked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1 size-5 shrink-0 accent-[var(--color-accent)]"
      />
      <span className="text-sm leading-relaxed text-text dark:text-gray-200">
        <span className="block font-semibold">
          {title}
          {locked && <span className="ml-2 text-xs font-normal text-muted">immer aktiv</span>}
        </span>
        {description}
      </span>
    </label>
  );
}

export default function ConsentBanner() {
  const consent = useConsent();
  const [reopened, setReopened] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [draft, setDraft] = useState<ConsentChoices>(CONSENT_NONE);
  const dialogRef = useRef<HTMLDivElement>(null);

  const isOpen = consent.status === "undecided" || (consent.status === "decided" && reopened);
  const canDismiss = consent.status === "decided";

  const close = useCallback(() => {
    setReopened(false);
    setShowDetails(false);
  }, []);

  const decide = useCallback(
    (choices: ConsentChoices) => {
      saveConsent(choices);
      close();
    },
    [close],
  );

  // Footer link → reopen with the stored choices pre-filled.
  useEffect(() => {
    const open = () => {
      setDraft(consent.status === "decided" ? { statistics: consent.statistics, external: consent.external } : CONSENT_NONE);
      setShowDetails(true);
      setReopened(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, open);
  }, [consent]);

  // Modal behaviour: lock scroll, move focus in, trap Tab, Esc only closes when a choice already exists.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && canDismiss) {
        close();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, canDismiss, close]);

  if (!isOpen) return null;

  return (
    <div className="consent-backdrop fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        aria-describedby="consent-text"
        className="consent-card max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6 dark:bg-gray-900"
      >
        <h2 id="consent-title" className="font-display text-2xl font-bold uppercase italic tracking-[-0.02em] text-text dark:text-white">
          Deine Privatsphäre
        </h2>
        <p id="consent-text" className="mt-2 text-sm leading-relaxed text-text dark:text-gray-300">
          Wir verwenden nur dann zusätzliche Dienste, wenn du zustimmst. Ohne Zustimmung bleibt die Website voll nutzbar;
          eingebundene Inhalte von Dritten (Tabellen, Karte) werden dann nicht geladen. Du kannst deine Auswahl jederzeit
          über „Cookie-Einstellungen“ im Seitenfuß ändern. Mehr in der{" "}
          <Link href="/datenschutz" className="text-link underline underline-offset-2">Datenschutzerklärung</Link>{" "}
          und im <Link href="/impressum" className="text-link underline underline-offset-2">Impressum</Link>.
        </p>

        {showDetails && (
          <div className="mt-4 space-y-3">
            <CategoryRow
              title="Notwendig"
              description="Speichert deine Datenschutzauswahl und die Wahl des hellen/dunklen Designs in deinem Browser. Ohne diese Einstellungen funktioniert die Website nicht wie gewünscht."
              checked
              locked
            />
            <CategoryRow
              title="Statistik"
              description="Vercel Web Analytics und Speed Insights messen anonymisiert Seitenaufrufe und Ladezeiten, um die Website zu verbessern. Anbieter: Vercel Inc., USA."
              checked={draft.statistics}
              onChange={(statistics) => setDraft((d) => ({ ...d, statistics }))}
            />
            <CategoryRow
              title="Externe Inhalte"
              description="Tabellen und Spielpläne von handball.net sowie die Karte von OpenStreetMap. Dabei wird deine IP-Adresse an den jeweiligen Anbieter übertragen."
              checked={draft.external}
              onChange={(external) => setDraft((d) => ({ ...d, external }))}
            />
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button type="button" className={BUTTON_CLASS} onClick={() => decide(CONSENT_NONE)}>
            Nur notwendige
          </button>
          {showDetails && (
            <button type="button" className={BUTTON_CLASS} onClick={() => decide(draft)}>
              Auswahl speichern
            </button>
          )}
          <button type="button" className={BUTTON_CLASS} onClick={() => decide(CONSENT_ALL)}>
            Alle akzeptieren
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          {!showDetails && (
            <button
              type="button"
              onClick={() => setShowDetails(true)}
              className="min-h-11 text-sm font-medium text-link underline underline-offset-2"
            >
              Einstellungen anpassen
            </button>
          )}
          {canDismiss && (
            <button type="button" onClick={close} className="ml-auto min-h-11 text-sm text-muted underline underline-offset-2">
              Schließen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
