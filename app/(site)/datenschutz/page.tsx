import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutz",
  description: "Datenschutzerklärung und Informationen zur Datenverarbeitung des TG MIPA Landshut.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Datenschutz | TG MIPA Landshut",
    description: "Datenschutzerklärung und Informationen zur Datenverarbeitung des TG MIPA Landshut.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function DatenschutzPage() {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="bg-background dark:bg-gray-900">
      {/* Dev-only warning banner */}
      {isDevelopment && (
        <div className="bg-yellow-100 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
              ⚠️ Platzhalter — Bitte Datenschutzerklärung ergänzen
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl md:text-4xl font-black text-text dark:text-white mb-8">
          Datenschutzerklärung
        </h1>

        {/* Datenschutzerklärung intro */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-text dark:text-white mb-4">
            Allgemeine Hinweise
          </h2>
          <div className="prose dark:prose-invert max-w-none text-text dark:text-gray-300">
            <p className="mb-4">
              [PLACEHOLDER] Diese Datenschutzerklärung erläutert, wie [PLACEHOLDER] Vereinsname
              Ihre personenbezogenen Daten verarbeitet und welche Rechte Sie diesbezüglich haben.
              Die nachfolgende Datenschutzerklärung ist als Beispiel zu verstehen und muss von
              Ihrem Verein an seine spezifische Situation angepasst werden.
            </p>
          </div>
        </section>

        {/* Verantwortlicher */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-text dark:text-white mb-4">
            Verantwortlicher
          </h2>
          <div className="prose dark:prose-invert max-w-none text-text dark:text-gray-300">
            <p className="mb-4">
              Verantwortlich für die Datenverarbeitung:
              <br />
              <strong>[PLACEHOLDER] Vereinsname</strong>
              <br />
              [PLACEHOLDER] Straße und Hausnummer
              <br />
              [PLACEHOLDER] PLZ und Ort
              <br />
              Kontakt: [PLACEHOLDER] E-Mail-Adresse
            </p>
          </div>
        </section>

        {/* Erhobene Daten */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-text dark:text-white mb-4">
            Erhobene Daten
          </h2>
          <div className="prose dark:prose-invert max-w-none text-text dark:text-gray-300">
            <p className="mb-4">
              [PLACEHOLDER] Auf dieser Website erheben und verarbeiten wir folgende Daten:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>[PLACEHOLDER] Kontaktformular-Eingaben (Name, E-Mail, Nachricht)</li>
              <li>[PLACEHOLDER] Server-Protokolldaten (IP-Adresse, Browserkennzeichnung, Zugriffsdatum)</li>
              <li>[PLACEHOLDER] Cookies und Tracking-Technologien</li>
              <li>[PLACEHOLDER] Benutzerinformationen bei Registrierung oder Anmeldung</li>
            </ul>
          </div>
        </section>

        {/* Rechtliche Grundlagen */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-text dark:text-white mb-4">
            Rechtliche Grundlagen
          </h2>
          <div className="prose dark:prose-invert max-w-none text-text dark:text-gray-300">
            <p>
              [PLACEHOLDER] Die Verarbeitung personenbezogener Daten erfolgt auf Grundlage der
              Datenschutz-Grundverordnung (DSGVO) sowie der geltenden Datenschutzgesetze. Insbesondere:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm mt-3">
              <li>Art. 6 DSGVO — Rechtmäßigkeit der Verarbeitung</li>
              <li>Art. 13 DSGVO — Informationspflicht bei Erhebung von Daten</li>
              <li>Art. 14 DSGVO — Informationspflicht bei Erhebung von Daten aus anderen Quellen</li>
            </ul>
          </div>
        </section>

        {/* Ihre Rechte */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-text dark:text-white mb-4">
            Ihre Rechte
          </h2>
          <div className="prose dark:prose-invert max-w-none text-text dark:text-gray-300">
            <p className="mb-4">
              [PLACEHOLDER] Nach der Datenschutz-Grundverordnung (DSGVO) haben Sie folgende Rechte:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>
                <strong>Artikel 15 DSGVO:</strong> Recht auf Auskunft über Ihre
                personenbezogenen Daten
              </li>
              <li>
                <strong>Artikel 16 DSGVO:</strong> Recht auf Berichtigung unrichtiger oder
                unvollständiger Daten
              </li>
              <li>
                <strong>Artikel 17 DSGVO:</strong> Recht auf Löschung Ihrer Daten
                („Recht auf Vergessenwerden")
              </li>
              <li>
                <strong>Artikel 18 DSGVO:</strong> Recht auf Einschränkung der Verarbeitung
              </li>
              <li>
                <strong>Artikel 20 DSGVO:</strong> Recht auf Datenportabilität
              </li>
              <li>
                <strong>Artikel 21 DSGVO:</strong> Recht auf Widerspruch gegen die Verarbeitung
              </li>
            </ul>
            <p className="mt-4">
              Um diese Rechte geltend zu machen, kontaktieren Sie bitte:{" "}
              <strong>[PLACEHOLDER] E-Mail-Adresse</strong>
            </p>
          </div>
        </section>

        {/* Datensicherheit */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-text dark:text-white mb-4">
            Datensicherheit
          </h2>
          <div className="prose dark:prose-invert max-w-none text-text dark:text-gray-300 text-sm">
            <p>
              [PLACEHOLDER] Wir setzen angemessene technische und organisatorische Maßnahmen ein,
              um Ihre personenbezogenen Daten vor unbefugtem Zugriff, Verlust, Missbrauch und
              Änderung zu schützen. Dazu gehören Verschlüsselung, Zugriffskontrolle und regelmäßige
              Sicherheitsprüfungen.
            </p>
          </div>
        </section>

        {/* Kontakt Datenschutzbeauftragter */}
        <section>
          <h2 className="text-xl font-bold text-text dark:text-white mb-4">
            Kontakt zur Datenschutzerklärung
          </h2>
          <div className="prose dark:prose-invert max-w-none text-text dark:text-gray-300 text-sm">
            <p>
              Für Fragen zur Datenschutzerklärung oder zur Verarbeitung Ihrer Daten wenden Sie
              sich bitte an:
              <br />
              <strong>[PLACEHOLDER] Datenschutzbeauftragter oder verantwortliche Person</strong>
              <br />
              E-Mail: [PLACEHOLDER] E-Mail-Adresse
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
