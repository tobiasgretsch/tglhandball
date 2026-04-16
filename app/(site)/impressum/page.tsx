import type { Metadata } from "next";

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

export default function ImpressumPage() {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl font-black text-text dark:text-white mb-8">
          Impressum
        </h1>

        {/* Angaben gemäß § 5 TMG */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-text dark:text-white mb-4">
            Angaben gemäß § 5 TMG
          </h2>
          <div className="prose dark:prose-invert max-w-none text-text dark:text-gray-300">
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
          <h2 className="text-xl font-bold text-text dark:text-white mb-4">
            Vertreten durch
          </h2>
          <div className="prose dark:prose-invert max-w-none text-text dark:text-gray-300">
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
          <h2 className="text-xl font-bold text-text dark:text-white mb-4">
            Kontakt
          </h2>
          <div className="prose dark:prose-invert max-w-none text-text dark:text-gray-300">
            <p>
              <strong>Telefon:</strong> [PLACEHOLDER] Telefonnummer
              <br />
              <strong>E-Mail:</strong> [PLACEHOLDER] E-Mail-Adresse
            </p>
          </div>
        </section>

        {/* Haftungsausschluss */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-text dark:text-white mb-4">
            Haftungsausschluss
          </h2>
          <div className="prose dark:prose-invert max-w-none text-text dark:text-gray-300 text-sm">
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
          <h2 className="text-xl font-bold text-text dark:text-white mb-4">
            Haftung für externe Links
          </h2>
          <div className="prose dark:prose-invert max-w-none text-text dark:text-gray-300 text-sm">
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
  );
}
