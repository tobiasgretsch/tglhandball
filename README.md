# TG MIPA Landshut – Vereinswebsite

Offizielle Website des TG MIPA Landshut e.V. – Handball mit Leidenschaft seit Jahrzehnten.

## Tech-Stack

| Bereich | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, Framer Motion |
| CMS | Sanity v5 (eingebettetes Studio unter `/studio`) |
| Auth | Clerk (Trainer- und Spieler-Dashboards) |
| E-Mail | Resend (Kontaktformular) |
| Analytics | Vercel Speed Insights |
| Sitemap | next-sitemap (wird nach jedem Build generiert) |

---

## Lokale Entwicklung

### 1. Voraussetzungen

- **Node.js 24 LTS** – `node -v` sollte `v24.x.x` zeigen
- **npm** (wird mit Node.js mitgeliefert)

### 2. Repository klonen

```bash
git clone https://github.com/tobiasgretsch/tglhandball.git
cd tglhandball
npm install
```

### 3. Umgebungsvariablen konfigurieren

```bash
cp .env.local.example .env.local
```

Dann `.env.local` ausfüllen:

| Variable | Beschreibung |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Öffentliche URL der Website, z. B. `https://tglhandball.de` |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity-Projekt-ID (aus dem Sanity-Dashboard) |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity-Dataset, Standard: `production` |
| `SANITY_API_TOKEN` | Sanity API-Token mit Schreibrechten |
| `RESEND_API_KEY` | API-Key von [resend.com](https://resend.com) |
| `RESEND_FROM_EMAIL` | Absender-Adresse (muss in Resend verifiziert sein) |
| `NEXT_PUBLIC_APP_URL` | App-URL für Clerk-Einladungslinks |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Publishable Key |
| `CLERK_SECRET_KEY` | Clerk Secret Key |

### 4. Entwicklungsserver starten

```bash
npm run dev
```

Die Website ist dann unter [http://localhost:3000](http://localhost:3000) erreichbar.
Das Sanity Studio findet sich unter [http://localhost:3000/studio](http://localhost:3000/studio).

---

## Verfügbare Befehle

```bash
npm run dev       # Entwicklungsserver starten (mit Turbopack)
npm run build     # Produktions-Build + TypeScript-Check + Sitemap-Generierung
npm run start     # Produktionsserver starten (nach build)
npm run lint      # ESLint-Prüfung
```

Nach `npm run build` wird automatisch `next-sitemap` ausgeführt und `public/sitemap.xml` sowie `public/robots.txt` generiert.

---

## Deployment auf Vercel

1. **Repository mit Vercel verbinden** – Im [Vercel-Dashboard](https://vercel.com) „Add New Project" → GitHub-Repository auswählen.

2. **Umgebungsvariablen setzen** – In den Projekteinstellungen unter „Environment Variables" alle Variablen aus `.env.local.example` eintragen.

3. **Automatisches Deployment** – Jeder Push auf `main` löst automatisch einen neuen Build aus.

4. **Domain konfigurieren** – Unter „Domains" die gewünschte Domain eintragen. Den Wert `NEXT_PUBLIC_SITE_URL` entsprechend anpassen.

> **Hinweis:** Sanity-Webhooks können eingerichtet werden, um On-Demand-Revalidierung zu triggern, damit Inhaltsänderungen sofort live gehen.

---

## Sanity Studio

Das Sanity Studio ist direkt in die Website eingebettet und unter `/studio` erreichbar.

- **Lokaler Zugang:** [http://localhost:3000/studio](http://localhost:3000/studio)
- **Produktions-Zugang:** `https://tglhandball.de/studio`
- **Zugang:** Nur Accounts mit Zugriff auf das Sanity-Projekt können das Studio nutzen.

---

## Redakteursleitfaden

### News-Artikel hinzufügen

1. Studio öffnen → **„News"** → **„Neues Dokument"**
2. Felder ausfüllen:
   - **Titel** – Überschrift des Artikels
   - **Slug** – wird automatisch aus dem Titel generiert (auf „Generieren" klicken)
   - **Kategorie** – Herren, Damen, Jugend oder Verein
   - **Veröffentlicht am** – Datum/Uhrzeit der Veröffentlichung
   - **Titelbild** – Empfohlenes Format: 16:9, mind. 1280 × 720 px
   - **Teaser** – Kurzbeschreibung (erscheint in Karten und Meta-Tags)
   - **Inhalt** – Fließtext im Portable-Text-Editor
3. **„Veröffentlichen"** klicken

### Spielergebnis eintragen

1. Studio → **„Spiele"** → bestehendes Spiel öffnen oder neues anlegen
2. Heim-/Auswärtsteam, Datum und Spielstätte eintragen
3. Nach dem Spiel: Feld **„Ergebnis"** ausfüllen (z. B. `28:24`)
4. **„Veröffentlichen"**

### Spieltagsmagazin hochladen

1. Studio → **„Spieltagsmagazine"** → **„Neues Dokument"**
2. Titel, Saison und Ausgabennummer eintragen
3. Unter **„PDF-Datei"** das Magazin hochladen
4. Optional: Titelbild für die Vorschau hochladen
5. **„Veröffentlichen"**

### Trainer einem Team zuweisen (Dashboard-Zugriff)

Damit ein Trainer nur die Spieler und Pläne seines Teams sieht:

1. Studio → **„Mannschaften"** → gewünschtes Team öffnen
2. Feld **„Trainer Clerk ID"** ausfüllen – die ID findet sich im [Clerk-Dashboard](https://dashboard.clerk.com) unter Users → User-Details → User ID (beginnt mit `user_`)
3. **„Veröffentlichen"**

---

## Projektstruktur (vereinfacht)

```
app/
  (site)/          # Öffentliche Website (News, Teams, Spielplan, …)
  (dashboard)/     # Trainer- und Spieler-Dashboards (Clerk-geschützt)
  api/             # API-Routen (Spieler, Trainingspläne, Uploads, …)
  studio/          # Eingebettetes Sanity Studio
components/
  layout/          # Header, Footer, Navigation
  sections/        # Seitenabschnitte (Hero, NewsClient, …)
  ui/              # Primitive UI-Komponenten
lib/
  sanity.ts        # Sanity-Client + urlFor()-Helfer
  queries.ts       # Alle GROQ-Abfragen
sanity/schemas/    # Sanity-Dokumenttypen
types/index.ts     # TypeScript-Typen
next-sitemap.config.js  # Sitemap-Konfiguration
```

---

## Lizenz

Privates Vereinsprojekt – alle Rechte vorbehalten.
