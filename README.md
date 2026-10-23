# TG MIPA Landshut – Vereinswebsite

Offizielle Website der Handballabteilung der TG MIPA Landshut: öffentliche Vereinsseiten, Spielplan mit Ergebnissen, Live-Ticker und ein Spielarchiv.

- **Live:** https://tglhandball.vercel.app/ (`tglhandball.de` zeigt noch die alte WordPress-Seite)
- **Repository:** https://github.com/tobiasgretsch/tglhandball

## Tech Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) · Tailwind CSS 4 (CSS-first, Konfiguration in `app/globals.css`) · Framer Motion · Sanity v5 als CMS · Hosting auf Vercel (Region `fra1`) · Node.js 24 LTS

## Loslegen

```bash
cp .env.local.example .env.local   # Werte eintragen
npm install
npm run dev                        # http://localhost:3000
```

| Befehl | Zweck |
|---|---|
| `npm run dev` | Dev-Server mit Turbopack |
| `npm run build` | Produktions-Build, TypeScript-Check; `postbuild` erzeugt `sitemap.xml` und `robots.txt` |
| `npm run start` | Produktionsserver (nach dem Build) |
| `npm run lint` | ESLint (Flat Config, `eslint.config.mjs`) |

### Umgebungsvariablen

| Variable | Zweck |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Kanonische URL (Metadaten, Sitemap, OG-Tags) |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` | Sanity-Projekt und Dataset (Standard: `production`) |
| `SANITY_API_TOKEN` | Sanity-Schreibtoken für den nuLiga-Sync und das Spielarchiv |
| `CRON_SECRET` | Schützt `/api/cron/sync-matches` |
| `NULIGA_LIVE_REST_BASE`, `NULIGA_CLUB_TEAMS_URL` | Optional: Live-Ticker auf einen Mock umleiten |

## Seiten

Alle öffentlichen Seiten liegen unter `app/(site)/`:

| Route | Inhalt |
|---|---|
| `/` | Startseite: Hero, Spiele, News, Partner |
| `/news`, `/news/[slug]` | News mit Kategoriefilter |
| `/teams`, `/teams/[slug]` | Mannschaften, Kader, Trainer, Spiele und Ergebnisse |
| `/spielplan` | Spielplan und Ergebnisse mit Filtern (Team, Saison, Monat, Heim/Auswärts, Ergebnis, Liga, Suche), Filter-Zustand in der URL |
| `/spielplan/[meetingId]` | Dauerhafte Seite eines beendeten Spiels aus dem Archiv (Jugend: `noindex`, ohne Spielernamen) |
| `/live`, `/live/[meetingId]` | Live-Übersicht und Ticker für ein Spiel (Spielverlauf, Statistik, Tabelle) |
| `/spieltagsmagazin` | PDF-Archiv des Spieltagsmagazins |
| `/impressionen` | Fotogalerie |
| `/ueberuns` | Verein, Vorstand, Halle, Kontakt (`/verein` und `/kontakt` leiten hierher um) |
| `/partner`, `/foerderverein`, `/fanshop` | Partner, Förderverein, Fanshop |
| `/impressum`, `/datenschutz` | Rechtliches |
| `/studio` | Sanity Studio (CMS) |

## Daten und Live-Ticker

Inhalte kommen aus Sanity (Schemas in `sanity/schemas/`, GROQ-Abfragen in `lib/queries.ts`). Spieldaten stammen von nuLiga:

```
nuLiga ──► /api/cron/sync-matches (täglich 21:30 UTC) ──► Sanity `match` (Spielplan)
nuLiga Live-REST ──► lib/live ──► /api/live, /api/live/[meetingId] ──► /live
beendetes Spiel ──► lib/live/archiveWrite ──► Sanity `matchArchive` ──► /spielplan/[meetingId]
```

- **Nächtlicher Cron** (`vercel.json`) liest den vollen Saisonspielplan (`lib/nuliga/sync.ts`), aktualisiert Tabellen und archiviert beendete Spiele. Spiele, die schon aus der nuLiga-Gruppenliste gefallen sind, werden über den eigenen Spielplan nachgeholt.
- **Live-Ticker** (`lib/live/`) holt Daten mit 15-s-Zeitfenstern von der nuScoreLive-REST-API, fasst gleiche Anfragen zusammen (`coalesce.ts`) und fällt bei Ausfällen auf den letzten Stand zurück. Die API-Routen sind per CDN gecacht (10 s bzw. 4 s) und bedienen nur Spiele aus der eigenen Spielliste.
- **Archiv** speichert die rohen nuLiga-Daten dauerhaft in `matchArchive`; geschrieben wird beim Aufruf eines beendeten Spiels und beim nächtlichen Sweep.
- **Lokal testen:** `node scripts/mock-nuliga.mjs [port]` startet einen nuLiga-Mock, der ein Spiel Ereignis für Ereignis abspielt. Dafür die beiden `NULIGA_*`-Variablen auf den Mock setzen. Achtung: Der Mock schreibt in das echte Sanity-Dataset, das Test-Dokument `matchArchive-9000001` danach löschen.

## Projektstruktur

```
app/              Routen, API, Studio, globals.css (Design-Tokens)
components/       layout/ (Header, Footer), sections/ (Seitenabschnitte), ui/ (Bausteine)
lib/              queries.ts, sanity*.ts, seo.ts, dates.ts, spielplanFilter.ts, nuliga/, live/
sanity/schemas/   news, team, match, matchArchive, partner, gallery, magazine, settings, …
scripts/          mock-nuliga.mjs
types/            Domain-Typen
```

## Hinweise

- **Zeitzone:** Datums- und Zeitformatierung in Client-Komponenten immer mit `timeZone: CLUB_TIME_ZONE` (`lib/dates.ts`), sonst gibt es Hydration-Fehler auf Vercel (UTC).
- **Sanity Studio** muss in Server-Seite und `'use client'`-Wrapper (`_studio-client.tsx`) getrennt bleiben.
- **PDF-Magazin lokal** nur auf Port 3000 testen; die Sanity-CORS-Liste kennt andere Origins nicht. Vor dem Umzug auf eine neue Domain diese dort eintragen.
- **Kein Login-Bereich:** Der Mitgliederbereich (Clerk) wurde entfernt und soll ohne ausdrückliche Anfrage nicht zurückkehren.

## Weiterführende Dokumente

- `CLAUDE.md` – Arbeitsregeln und Architektur für Claude Code
- `lessons.md` – Fehler und daraus abgeleitete Regeln
- `PRODUCT.md`, `DESIGN.md` – Produktziel, Zielgruppen und Design-System
- `SECURITY-REVIEW.md` – Ergebnis der Sicherheitsprüfung
