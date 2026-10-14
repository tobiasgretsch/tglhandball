import type { LegalBlock } from "@/components/ui/LegalDocument";

const CLUB_CONTACT =
  "Förderverein des Handballsports der Turngemeinde Landshut e. V.\nEnglbergweg 30\n84036 Landshut\nfoerderverein@tg-landshut-handball.de";

// Stand: Oktober 2026. Beschreibt die tatsächlich auf dieser Website eingesetzten Dienste.
// TODO: Vor Veröffentlichung juristisch prüfen lassen (z. B. Vereinsverband, Datenschutzbeauftragte/r).
export const DATENSCHUTZ_BLOCKS: LegalBlock[] = [
  { type: "h2", text: "1. Datenschutz auf einen Blick" },
  { type: "h3", text: "Allgemeine Hinweise" },
  {
    type: "p",
    text: "Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.",
  },
  { type: "h3", text: "Verantwortliche Stelle" },
  { type: "address", text: CLUB_CONTACT },
  {
    type: "p",
    text: "Vertreten durch den 1. Vorsitzenden Dr. Christian Kraus. Verantwortliche Stelle ist die Stelle, die allein oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten entscheidet.",
  },
  { type: "h3", text: "Welche Daten erfassen wir und wofür?" },
  {
    type: "p",
    text: "Beim Besuch der Website fallen technische Daten an (siehe Hosting und Server-Log-Dateien). Weitere Daten verarbeiten wir nur, wenn Sie uns diese mitteilen (z. B. per E-Mail oder über das Formular zur Fördermitgliedschaft). Diese Website verwendet keine Werbe-Cookies. Statistik und eingebundene Inhalte Dritter (Tabellen, Karte) werden nur mit Ihrer Einwilligung geladen.",
  },
  { type: "h3", text: "Ihre Rechte" },
  {
    type: "p",
    text: "Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten sowie ein Recht auf Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Details finden Sie in Abschnitt 6. Wenden Sie sich dazu an die oben genannte Stelle.",
  },

  { type: "h2", text: "2. Allgemeine Hinweise und Pflichtinformationen" },
  { type: "h3", text: "Datenschutz" },
  {
    type: "p",
    text: "Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften (DSGVO, BDSG, TDDDG) sowie dieser Datenschutzerklärung. Bei der Datenübertragung im Internet (z. B. per E-Mail) können Sicherheitslücken bestehen. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.",
  },
  { type: "h3", text: "Widerruf Ihrer Einwilligung" },
  {
    type: "p",
    text: "Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine bereits erteilte Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen. Dazu reicht eine formlose Mitteilung per E-Mail an uns. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.",
  },
  { type: "h3", text: "SSL- bzw. TLS-Verschlüsselung" },
  {
    type: "p",
    text: "Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von „http://“ auf „https://“ wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.",
  },
  { type: "h3", text: "Widerspruch gegen Werbe-Mails" },
  {
    type: "p",
    text: "Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten zur Übersendung von nicht ausdrücklich angeforderter Werbung und Informationsmaterialien wird hiermit widersprochen. Die Betreiber der Seiten behalten sich ausdrücklich rechtliche Schritte im Falle der unverlangten Zusendung von Werbeinformationen, etwa durch Spam-E-Mails, vor.",
  },

  { type: "h2", text: "3. Datenerfassung auf dieser Website" },
  { type: "h3", text: "Hosting (Vercel)" },
  {
    type: "p",
    text: "Diese Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA, gehostet. Beim Aufruf der Website verarbeitet Vercel die in den Server-Log-Dateien genannten Daten in unserem Auftrag. Mit Vercel besteht ein Vertrag zur Auftragsverarbeitung gemäß Art. 28 DSGVO. Die Übermittlung in die USA stützt sich auf den Angemessenheitsbeschluss der EU-Kommission zum EU-U.S. Data Privacy Framework (Art. 45 DSGVO), dem Vercel angehört, sowie ergänzend auf Standardvertragsklauseln.",
  },
  {
    type: "p",
    text: "Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO: Unser berechtigtes Interesse liegt in der sicheren und fehlerfreien Bereitstellung der Website.",
  },
  { type: "h3", text: "Server-Log-Dateien" },
  {
    type: "p",
    text: "Der Hosting-Anbieter erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr Browser automatisch übermittelt. Dies sind:",
  },
  {
    type: "ul",
    items: [
      "Browsertyp und Browserversion",
      "verwendetes Betriebssystem",
      "Referrer URL",
      "Hostname des zugreifenden Rechners",
      "Uhrzeit der Serveranfrage",
      "IP-Adresse",
    ],
  },
  {
    type: "p",
    text: "Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (Sicherheit und Stabilität der Website).",
  },
  { type: "h3", text: "Inhalte-Datenbank (Sanity)" },
  {
    type: "p",
    text: "Texte, Bilder und Dokumente (z. B. News, Mannschaften, Spieltagsmagazine) verwalten wir mit dem Content-Management-System Sanity (Sanity AS, Norwegen). Die Inhalte werden serverseitig abgerufen und Bilder über unseren eigenen Server ausgeliefert; Ihr Browser baut dabei in der Regel keine direkte Verbindung zu Sanity auf. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.",
  },
  { type: "h3", text: "Statistik (Vercel Web Analytics und Speed Insights)" },
  {
    type: "p",
    text: "Wir nutzen Vercel Web Analytics und Vercel Speed Insights, um die Nutzung und Ladezeit der Website zu verstehen und zu verbessern. Die Dienste arbeiten ohne Cookies und ohne Speicherung von Informationen auf Ihrem Endgerät; Besucher werden nicht seitenübergreifend wiedererkannt oder über Websites hinweg verfolgt. Erfasst werden aggregierte Daten wie aufgerufene Seite, Referrer, Land, Browser, Gerätetyp und Ladezeiten. Die Dienste werden ausschließlich geladen, wenn Sie im Einwilligungsbanner der Kategorie „Statistik“ zugestimmt haben. Rechtsgrundlage sind Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG. Sie können Ihre Einwilligung jederzeit über „Cookie-Einstellungen“ im Seitenfuß widerrufen.",
  },
  { type: "h3", text: "Einwilligungsverwaltung, Cookies und lokaler Speicher" },
  {
    type: "p",
    text: "Beim ersten Besuch fragen wir Sie in einem Banner nach Ihrer Einwilligung. Sie können alles ablehnen („Nur notwendige“), alles akzeptieren oder einzelne Kategorien auswählen („Statistik“, „Externe Inhalte“). Ablehnen ist genauso einfach wie Zustimmen; die Website bleibt auch ohne Einwilligung nutzbar. Ihre Auswahl können Sie jederzeit über „Cookie-Einstellungen“ im Seitenfuß ändern oder widerrufen.",
  },
  {
    type: "p",
    text: "Diese Website setzt keine Cookies. Im Browser-Speicher (localStorage) werden ausschließlich gespeichert: Ihre Einwilligungsauswahl (Schlüssel „tgl-consent“; Auswahl, Zeitpunkt und Version des Banners, damit wir Ihre Entscheidung nachweisen und Sie nicht bei jedem Besuch erneut fragen müssen) sowie Ihre Auswahl für das helle bzw. dunkle Erscheinungsbild („theme“). Beides ist technisch erforderlich, um von Ihnen ausdrücklich getroffene Entscheidungen bereitzustellen (§ 25 Abs. 2 Nr. 2 TDDDG); Rechtsgrundlage der Verarbeitung ist Art. 6 Abs. 1 lit. c i. V. m. Art. 7 Abs. 1 DSGVO (Nachweispflicht) bzw. lit. f DSGVO. Die Einwilligung wird nach einer Änderung des Banners erneut eingeholt.",
  },
  { type: "h3", text: "Schriftarten" },
  {
    type: "p",
    text: "Die auf dieser Website verwendeten Schriftarten (Inter, Barlow Condensed) werden beim Build-Vorgang lokal eingebunden und von unserem eigenen Server ausgeliefert. Es erfolgt keine Verbindung zu Servern von Google.",
  },
  { type: "h3", text: "Kontaktaufnahme per E-Mail" },
  {
    type: "p",
    text: "Wenn Sie uns per E-Mail kontaktieren, speichern wir Ihre Angaben inklusive der Kontaktdaten zur Bearbeitung Ihrer Anfrage und für den Fall von Anschlussfragen. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage mit der Erfüllung eines Vertrags oder vorvertraglicher Maßnahmen zusammenhängt, andernfalls Art. 6 Abs. 1 lit. f DSGVO (effektive Bearbeitung von Anfragen). Die Daten werden gelöscht, sobald sie für den Zweck nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungsfristen entgegenstehen.",
  },
  { type: "h3", text: "Formular zur Fördermitgliedschaft" },
  {
    type: "p",
    text: "Wenn Sie über das Formular auf der Seite „Förderverein“ eine Fördermitgliedschaft beantragen, verarbeiten wir die von Ihnen eingegebenen Daten: Anrede, Vor- und Nachname, Anschrift, E-Mail-Adresse, optional Geburtsdatum und Telefonnummer sowie für das SEPA-Lastschriftmandat IBAN, Kontoinhaber und ggf. Kreditinstitut. Die Daten werden zur Begründung und Durchführung der Mitgliedschaft und zum Einzug der Beiträge verarbeitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Aufbewahrungsfristen nach Handels- und Steuerrecht (Art. 6 Abs. 1 lit. c DSGVO) bleiben unberührt. Die Angabe der Pflichtfelder ist für den Abschluss der Mitgliedschaft erforderlich.",
  },

  { type: "h2", text: "4. Eingebundene Inhalte und externe Dienste" },
  { type: "h3", text: "Handball.net-Widgets (Tabellen und Spielpläne)" },
  {
    type: "p",
    text: "Auf den Mannschaftsseiten binden wir Tabellen und Spielpläne der Plattform handball.net (www.handball.net) ein. Dazu lädt Ihr Browser ein Skript von handball.net. Hierbei wird Ihre IP-Adresse an den Betreiber von handball.net übermittelt. Es werden von uns keine weiteren Daten an handball.net übertragen. Das Skript wird erst nach Ihrer Einwilligung in die Kategorie „Externe Inhalte“ geladen (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG); ohne Einwilligung sehen Sie nur einen Platzhalter. Die Einwilligung ist jederzeit über „Cookie-Einstellungen“ widerrufbar. Weitere Informationen finden Sie in der Datenschutzerklärung von handball.net.",
  },
  { type: "h3", text: "Spielplan- und Ergebnisdaten (nuLiga)" },
  {
    type: "p",
    text: "Spielpläne, Ergebnisse und Spielberichte beziehen wir über den Spielbetrieb des Bayerischen Handball-Verbands (nuLiga, bhv-handball.liga.nu). Der Abruf erfolgt ausschließlich serverseitig; Ihre personenbezogenen Daten werden dabei nicht an nuLiga übermittelt. Beim Öffnen eines Spielberichts wird das Dokument über unseren Server bereitgestellt.",
  },
  { type: "h3", text: "Kartendarstellung (OpenStreetMap)" },
  {
    type: "p",
    text: "Auf der Seite „Über uns“ zeigen wir die Hallenlage mit einer interaktiven Karte (Leaflet) auf Basis von OpenStreetMap. Beim Anzeigen der Karte lädt Ihr Browser Kartenkacheln von den Servern der OpenStreetMap Foundation (St John’s Innovation Centre, Cowley Road, Cambridge CB4 0WS, Vereinigtes Königreich). Dabei wird Ihre IP-Adresse an die OpenStreetMap Foundation übermittelt. Für das Vereinigte Königreich besteht ein Angemessenheitsbeschluss der EU-Kommission. Die Karte wird erst nach Ihrer Einwilligung in die Kategorie „Externe Inhalte“ geladen (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG); ohne Einwilligung sehen Sie nur einen Platzhalter. Weitere Informationen: https://wiki.osmfoundation.org/wiki/Privacy_Policy",
  },
  { type: "h3", text: "PDF-Anzeige" },
  {
    type: "p",
    text: "Spieltagsmagazine und Trainingspläne werden in einem integrierten PDF-Betrachter angezeigt. Die dafür notwendigen Programmbestandteile werden von unserem eigenen Server ausgeliefert; es erfolgt keine Verbindung zu Drittanbietern.",
  },
  { type: "h3", text: "Fanshop (uhlsport)" },
  {
    type: "p",
    text: "Die Seite „Fanshop“ verlinkt auf den Club-Shop von uhlsport (https://clubshop.uhlsport.com/tg-landshut/). Produktbilder werden über unseren Server geladen. Erst wenn Sie einen Link zum Shop anklicken, verlassen Sie unsere Website; ab diesem Zeitpunkt gilt die Datenschutzerklärung von uhlsport.",
  },

  { type: "h2", text: "5. Social-Media-Auftritte" },
  {
    type: "p",
    text: "Wir verlinken auf unsere Auftritte bei Instagram, Facebook und YouTube. Es handelt sich um einfache Links, nicht um eingebundene Plugins: Erst wenn Sie einen Link anklicken, werden Daten an die jeweilige Plattform übermittelt.",
  },
  { type: "h3", text: "Verantwortlichkeit" },
  {
    type: "p",
    text: "Neben uns ist auch der Betreiber der jeweiligen Plattform Verantwortlicher für die Datenverarbeitung auf der Plattform, auf die wir nur begrenzten Einfluss haben. Wo wir Einfluss nehmen können, wirken wir auf einen datenschutzgerechten Umgang hin. Näheres regeln die Datenschutzerklärungen der Anbieter:",
  },
  {
    type: "ul",
    items: [
      "Instagram / Facebook: https://privacycenter.instagram.com/policy bzw. https://www.facebook.com/policy.php",
      "YouTube: https://policies.google.com/privacy",
    ],
  },
  { type: "h3", text: "Datenverarbeitung durch uns" },
  {
    type: "p",
    text: "Die von Ihnen auf unseren Social-Media-Seiten eingegebenen Daten wie z. B. Kommentare, Likes oder öffentliche Nachrichten werden durch die Plattform veröffentlicht und von uns nicht für andere Zwecke verwendet. Wir behalten uns vor, Inhalte zu löschen, sofern dies erforderlich ist. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (Öffentlichkeitsarbeit und Kommunikation). Auf unseren Seiten nutzen wir keine demografischen, interessen-, verhaltens- oder standortbasierten Zielgruppen für Werbung. Statistiken der Plattformen (z. B. Seiten-Insights) enthalten zusammengefasste Daten und können uns Aufschluss darüber geben, wie Personen mit unseren Seiten interagieren. Zu Facebook-Seiten-Insights: https://www.facebook.com/legal/terms/page_controller_addendum",
  },
  { type: "h3", text: "Datenverarbeitung durch die Plattformbetreiber" },
  {
    type: "p",
    text: "Die Plattformbetreiber setzen Webtracking-Methoden ein, auch unabhängig davon, ob Sie angemeldet sind. Darauf haben wir kaum Einfluss. Es kann nicht ausgeschlossen werden, dass Ihre Profil- und Verhaltensdaten ausgewertet werden. Widerspruchsmöglichkeiten finden Sie in den Datenschutzerklärungen der Anbieter.",
  },

  { type: "h2", text: "6. Ihre Rechte" },
  { type: "strong", text: "1.) Auskunftsrecht (Art. 15 DSGVO)" },
  {
    type: "p",
    text: "Sie haben das Recht, eine Bestätigung darüber zu verlangen, ob Sie betreffende personenbezogene Daten verarbeitet werden; ist dies der Fall, haben Sie ein Recht auf Auskunft über diese Daten und auf die in Art. 15 DSGVO im Einzelnen aufgeführten Informationen.",
  },
  { type: "strong", text: "2.) Recht auf Berichtigung und Löschung (Art. 16 und 17 DSGVO)" },
  {
    type: "p",
    text: "Sie haben das Recht, unverzüglich die Berichtigung unrichtiger personenbezogener Daten und ggf. die Vervollständigung unvollständiger Daten zu verlangen. Sie haben zudem das Recht, die unverzügliche Löschung Ihrer Daten zu verlangen, sofern einer der in Art. 17 DSGVO aufgeführten Gründe zutrifft, z. B. wenn die Daten für die verfolgten Zwecke nicht mehr benötigt werden.",
  },
  { type: "strong", text: "3.) Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)" },
  {
    type: "p",
    text: "Sie haben das Recht, die Einschränkung der Verarbeitung zu verlangen, wenn eine der in Art. 18 DSGVO aufgeführten Voraussetzungen gegeben ist.",
  },
  { type: "strong", text: "4.) Recht auf Datenübertragbarkeit (Art. 20 DSGVO)" },
  {
    type: "p",
    text: "In den in Art. 20 DSGVO genannten Fällen haben Sie das Recht, die Sie betreffenden personenbezogenen Daten in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten bzw. deren Übermittlung an einen Dritten zu verlangen.",
  },
  { type: "strong", text: "5.) Widerspruchsrecht (Art. 21 DSGVO)" },
  {
    type: "p",
    text: "Werden Daten auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigte Interessen) verarbeitet, haben Sie das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit Widerspruch gegen die Verarbeitung einzulegen. Wir verarbeiten die Daten dann nicht mehr, es sei denn, wir können zwingende schutzwürdige Gründe nachweisen, die Ihre Interessen, Rechte und Freiheiten überwiegen, oder die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen.",
  },
  { type: "h3", text: "Beschwerderecht bei einer Aufsichtsbehörde" },
  {
    type: "p",
    text: "Sie haben gemäß Art. 77 DSGVO das Recht auf Beschwerde bei einer Aufsichtsbehörde, wenn Sie der Ansicht sind, dass die Verarbeitung der Sie betreffenden Daten gegen datenschutzrechtliche Bestimmungen verstößt. Für uns zuständig ist das Bayerische Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach, https://www.lda.bayern.de. Das Beschwerderecht kann auch bei einer Aufsichtsbehörde Ihres Aufenthaltsorts oder Arbeitsplatzes geltend gemacht werden.",
  },
];
