import type { LegalBlock } from "@/components/ui/LegalDocument";

const CLUB_ADDRESS =
  "Förderverein des Handballsports der Turngemeinde Landshut e. V.\nEnglbergweg 30\n84036 Landshut";

// Übernommen von der bisherigen Website tglhandball.de (Stand: Oktober 2026).
export const IMPRESSUM_BLOCKS: LegalBlock[] = [
  { type: "h2", text: "Angaben gemäß § 5 TMG" },
  { type: "address", text: CLUB_ADDRESS },
  { type: "h2", text: "Vertreten durch" },
  { type: "p", text: "1. Vorsitzender Dr. Christian Kraus" },
  { type: "h2", text: "Kontakt" },
  { type: "p", text: "E-Mail: foerderverein@tg-landshut-handball.de" },
  { type: "h2", text: "Vereinsregister" },
  { type: "address", text: "Sitz des Vereins: Landshut\nRegistergericht: Amtsgericht Landshut\nRegisternummer: VR201130" },
  { type: "h2", text: "Umsatzsteuer-ID" },
  { type: "p", text: "Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz: DE359904473" },
  { type: "h2", text: "Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV" },
  { type: "address", text: CLUB_ADDRESS },
  { type: "h2", text: "Bilder" },
  {
    type: "address",
    text: "Bruno Bounty Fotographie Bruno Bounty Photography\nDirk Mahler\nTG Landshut Handball\nDHB-Vereine\nhandball.net",
  },
  { type: "h2", text: "Streitschlichtung" },
  {
    type: "p",
    text: "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr.",
  },
  { type: "p", text: "Unsere E-Mail-Adresse finden Sie oben im Impressum." },
  {
    type: "p",
    text: "Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
  },
  { type: "h2", text: "Haftung für Inhalte" },
  {
    type: "p",
    text: "Die Informationen auf dieser Seite sind allgemeiner und informativer Art. Die Inhalte dieser Seiten werden mit größter Sorgfalt erstellt. Wir weisen aber darauf hin, dass sich das Recht, das Internet und die entsprechenden Technologien weiter entwickeln was dazu führen kann, dass Informationen nach einiger Zeit veraltet, unrichtig oder widersprüchlich sein können.",
  },
  { type: "h2", text: "Haftung für Links" },
  {
    type: "p",
    text: "Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.",
  },
  {
    type: "p",
    text: "Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.",
  },
  { type: "h2", text: "Urheberrecht" },
  {
    type: "p",
    text: "Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.",
  },
  {
    type: "p",
    text: "Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.",
  },
];
