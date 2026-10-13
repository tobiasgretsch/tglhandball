import type { Metadata } from "next";
import { client } from "@/lib/sanity";
import { pageHeroSlidesQuery } from "@/lib/queries";
import type { SanityImage } from "@/types";
import PageHeroSlider from "@/components/sections/PageHeroSlider";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum und rechtliche Informationen des TG MIPA Landshut.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Impressum | TG MIPA Landshut",
    description: "Impressum und rechtliche Informationen des TG MIPA Landshut.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function ImpressumPage() {
  const slides = await client
    .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
    .catch(() => [] as SanityImage[]);
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <>
      <PageHeroSlider slides={slides ?? []} title="Impressum" subtitle="Rechtliche Angaben des TG MIPA Landshut." />
    <div className="bg-background dark:bg-gray-900">
      {/* Dev-only warning banner */}
      {isDevelopment && (
        <div className="bg-yellow-100 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
              ⚠️ Platzhalter — Bitte Impressum-Inhalt ergänzen
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-4">

        {/* Angaben gemäß § 5 TMG */}
        <section className="mb-8">
          <h2 className="font-display font-bold italic uppercase text-2xl tracking-[-0.02em] text-text dark:text-white mb-4">
            Angaben gemäß § 5 TMG
          </h2>
          <div className="prose dark:prose-invert max-w-[65ch] leading-[1.7] text-text dark:text-gray-300">
            <p className="mb-4">
              <strong>[PLACEHOLDER] Vereinsname</strong>
              <br />
              [PLACEHOLDER] Straße und Hausnummer
              <br />
              [PLACEHOLDER] PLZ und Ort
              <br />
              [PLACEHOLDER] Bundesland
            </p>
          </div>
        </section>

        {/* Vertreten durch */}
        <section className="mb-8">
          <h2 className="font-display font-bold italic uppercase text-2xl tracking-[-0.02em] text-text dark:text-white mb-4">
            Vertreten durch
          </h2>
          <div className="prose dark:prose-invert max-w-[65ch] leading-[1.7] text-text dark:text-gray-300">
            <p className="mb-2">
              <strong>[PLACEHOLDER] Vorsitzender Name</strong>
              <br />
              Funktion: [PLACEHOLDER] Vorsitzender/in
            </p>
            <p>
              <strong>[PLACEHOLDER] Zweiter Vorsitzender Name</strong>
              <br />
              Funktion: [PLACEHOLDER] Stellvertretender Vorsitzender/in
            </p>
          </div>
        </section>

        {/* Kontakt */}
        <section className="mb-8">
          <h2 className="font-display font-bold italic uppercase text-2xl tracking-[-0.02em] text-text dark:text-white mb-4">
            Kontakt
          </h2>
          <div className="prose dark:prose-invert max-w-[65ch] leading-[1.7] text-text dark:text-gray-300">
            <p>
              <strong>Telefon:</strong> [PLACEHOLDER] Telefonnummer
              <br />
              <strong>E-Mail:</strong> [PLACEHOLDER] E-Mail-Adresse
            </p>
          </div>
        </section>

        {/* Haftungsausschluss */}
        <section className="mb-8">
          <h2 className="font-display font-bold italic uppercase text-2xl tracking-[-0.02em] text-text dark:text-white mb-4">
            Haftungsausschluss
          </h2>
          <div className="prose dark:prose-invert max-w-[65ch] leading-[1.7] text-text dark:text-gray-300 text-sm">
            <p>
              [PLACEHOLDER] Die Inhalte dieser Website werden mit größter Sorgfalt erstellt.
              Der Anbieter übernimmt jedoch keine Gewähr für die Richtigkeit, Vollständigkeit
              und Aktualität der bereitgestellten Inhalte. Die Nutzung der Inhalte der Website
              erfolgt auf eigene Gefahr des Nutzers. Namentlich gekennzeichnete Beiträge geben
              die Meinung des jeweiligen Autors und nicht immer die Meinung des Anbieters wieder.
            </p>
          </div>
        </section>

        {/* Haftung für externe Links */}
        <section className="mb-8">
          <h2 className="font-display font-bold italic uppercase text-2xl tracking-[-0.02em] text-text dark:text-white mb-4">
            Haftung für externe Links
          </h2>
          <div className="prose dark:prose-invert max-w-[65ch] leading-[1.7] text-text dark:text-gray-300 text-sm">
            <p>
              [PLACEHOLDER] Für die Inhalte externer Links sind ausschließlich deren Betreiber
              verantwortlich. Der Anbieter hat die verlinkte Seite bei Erstellung des Links
              überprüft. Eine ständige Kontrolle der Inhalte verlinker Seiten ist jedoch ohne
              konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar.
            </p>
          </div>
        </section>
      </div>
    </div>
    </>
  );
}
