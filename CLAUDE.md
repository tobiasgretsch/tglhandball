# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TG MIPA Landshut Handball** — official club website with public-facing content and a protected member area. Repository: https://github.com/tobiasgretsch/tglhandball

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 (strict) |
| UI | React 19, Tailwind CSS 4 (CSS-first config) |
| Animation | Framer Motion |
| Icons | lucide-react |
| CMS | Sanity v5 — next-sanity@12, @sanity/client@7, @sanity/image-url@2, @sanity/vision@5 |
| Sitemap | next-sitemap@4 — runs as `postbuild`, generates `public/sitemap.xml` + `public/robots.txt` |
| Analytics | `@vercel/speed-insights` |
| Runtime | Node.js 24.14.0 LTS · npm |

**Key package versions:**
- `next@16` · `react@19` · `tailwindcss@4` · `eslint@10`
- `next-sanity@12` · `sanity@5` · `@sanity/client@7` · `@sanity/image-url@2`
- `next-sitemap@4`

---

## Commands

```bash
npm run dev       # Dev server with Turbopack (http://localhost:3000)
npm run build     # Production build + TypeScript check + sitemap generation (postbuild)
npm run start     # Production server (run after build)
npm run lint      # ESLint check
```

`npm run build` automatically runs `next-sitemap` via the `postbuild` hook, which generates `public/sitemap.xml` and `public/robots.txt` from `next-sitemap.config.js`.

---

## Full Architecture

```
app/
  layout.tsx                    # Root layout — Inter font, lang="de",
                                #   metadataBase, title template, JSON-LD SportsOrganization
  globals.css                   # Tailwind v4 @import + @theme color tokens + focus-visible
                                #   ring + .skip-link accessibility class

  (site)/                       # Public website — wrapped with Header + Footer
    layout.tsx                  # Skip-to-content link + <main id="main-content">
    page.tsx                    # Homepage (Hero, Matches, News, Partners)
    news/
      page.tsx                  # News listing with category filter
      [slug]/page.tsx           # News article detail (generateStaticParams + generateMetadata)
    teams/
      page.tsx                  # Teams overview grid
      [slug]/page.tsx           # Team detail (squad, coaches, fixtures, results)
    spielplan/page.tsx          # Fixture & results listing with team filter
    live/page.tsx               # Live overview: running / next / last TG games
    live/[meetingId]/page.tsx   # Live ticker for one game (noindex, polls /api/live/[id])
    spieltagsmagazin/page.tsx   # Magazine PDF archive
    impressionen/page.tsx       # Photo gallery
    ueberuns/page.tsx           # Club history, board, venue map, contact form
    partner/page.tsx            # Premium + standard partners
    kontakt/page.tsx            # Redirects → /ueberuns#kontakt
    verein/page.tsx             # Redirects → /ueberuns


  api/
    live/route.ts               # TG games ±days + live flags + pollAfterMs (CDN-cached 10 s)
    live/[meetingId]/route.ts   # Full ticker snapshot (CDN-cached 4 s); only ids from our own game list

  studio/[[...tool]]/
    page.tsx                    # Server component — metadata/viewport only
    _studio-client.tsx          # 'use client' wrapper for <NextStudio />

components/
  layout/
    Header.tsx                  # Server component — fetches settings + teams, passes to client
    HeaderClient.tsx            # 'use client' — sticky header, dropdown nav, mobile drawer,
                                #   theme toggle; aria-label on navs, aria-expanded on dropdowns
    Footer.tsx                  # Partner strips, social links, quick links, contact
  sections/                     # Full-page sections (HeroSection, NewsClient, SpielplanClient,
                                #   GalleryClient, MagazineClient, PageHeroSlider, …)
  ui/                           # Primitive components (PortableText, ScrollToTop, …)

lib/
  live/                         # nuLiga live ticker: parse.ts (defensive parsers), events.ts (feed/status/score),
                                #   fixture.ts (Sanity match ↔ live game), upstream.ts (REST client, 15 s time buckets),
                                #   schedule.ts (two-tier polling), ticker.ts (snapshot), stats.ts (per-team match stats from the feed),
                                #   table.ts (league position from the nuLiga group page), coalesce.ts (dedupe + stale fallback)
  sanity.ts                     # Read-only Sanity client + urlFor() helper
  sanity-write.ts               # Write client (uses SANITY_API_TOKEN)
  queries.ts                    # All GROQ queries (allNewsQuery, teamDetailQuery,
                                #   settingsQuery, spielplanQuery, …)

sanity/
  schemas/
    news.ts                     # News article
    team.ts                     # Team
    match.ts                    # Match / fixture
    magazine.ts                 # Spieltagsmagazin
    partner.ts                  # Sponsor/partner (tier: premium | standard)
    gallery.ts                  # Gallery item
    settings.ts                 # Singleton — clubName, logo, heroImage, social URLs, venue, board
    index.ts                    # Schema registry

sanity.config.ts                # Studio config — basePath "/studio", singleton settings doc
next-sitemap.config.js          # Sitemap config — fetches news/team slugs from Sanity at build time
types/index.ts                  # Domain types: NewsArticle, Team, Match, Magazine,
                                #   Partner, GalleryItem, Settings, SanityImage, Slug, …
```

---

## Data Flow

```
Sanity CMS
  └─ GROQ queries (lib/queries.ts)
       └─ Server Components (app/(site)/**/page.tsx)
            └─ Rendered via components/sections/


```

---

## Color Palette

Defined via `@theme` in `app/globals.css` (Tailwind v4 CSS-first, no `tailwind.config.ts`):

| Token | Class | Hex |
|---|---|---|
| `primary` | `bg-primary`, `text-primary` | `#da251c` |
| `primary-light` | `bg-primary-light` | `#e64752` |
| `accent` | `bg-accent`, `text-accent` | `#004f9f` |
| `background` | `bg-background` | `#F8F9FA` |
| `text` | `text-text` | `#1A1A1A` |
| `muted` | `text-muted` | `#6B7280` |


---

## Environment Variables

Copy `.env.local.example` → `.env.local`:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URL — used for `metadataBase`, sitemap, OG tags |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset (default: `production`) |
| `SANITY_API_TOKEN` | Sanity write token — required for the NuLiga match sync |
| `NULIGA_LIVE_REST_BASE`, `NULIGA_CLUB_TEAMS_URL` | Optional. Point the live ticker at a mock nuLiga for testing; defaults are the real endpoints |

---

## SEO & Performance Status

- **`metadataBase`** set from `NEXT_PUBLIC_SITE_URL` in root layout — all OG image URLs are absolute.
- **`title.template`** = `"%s | TG MIPA Landshut"` — every page uses the short title form.
- **JSON-LD** `SportsOrganization` schema injected in root layout `<head>` — populated from Sanity settings.
- **Twitter cards** `summary_large_image` set on all pages including dynamic news/team slugs.
- **Sitemap** auto-generated post-build at `public/sitemap.xml` — includes static routes + dynamic news/team slugs fetched from Sanity.
- **robots.txt** auto-generated — disallows `/studio`, `/api`.
- **Skip-to-content** link on site layout; `:focus-visible` ring in club red on all interactive elements.
- **Aria labels** on header nav elements, dropdown buttons (`aria-haspopup`, `aria-expanded`), and all partner links.
- All `<Image>` components have meaningful `alt` text; decorative watermarks use `aria-hidden`.

---

## Permanent Patterns & Constraints

### Sanity Studio — SSR split (PERMANENT)
`NextStudio` cannot render in a plain Server Component (causes `createContext is not a function` due to `styled-components` in the Studio bundle). **Always** split into:
- `app/studio/[[...tool]]/page.tsx` — Server Component, exports `metadata` + `viewport` only
- `app/studio/[[...tool]]/_studio-client.tsx` — `'use client'`, renders `<NextStudio />`

### Tailwind v4 — CSS-first config (PERMANENT)
- No `tailwind.config.ts` — all config lives in `app/globals.css` under `@theme {}`
- PostCSS plugin: `@tailwindcss/postcss` (not `tailwindcss`)
- Import: `@import "tailwindcss"` (not `@tailwind base/components/utilities`)
- Custom color tokens: `--color-primary`, `--color-accent`, `--color-background`, etc.


### `@sanity/image-url` v2 import path
`SanityImageSource` is exported from `"@sanity/image-url"` (package root). Do **not** use the v1 path `"@sanity/image-url/lib/types/types"`.


---

## Operating Rules

The sections below define how Claude must behave in this project. Read them fully before starting any task.

---

## §1 Plan Before Acting

Before writing a single line of code, Claude must produce an explicit plan.

- Break the task into numbered steps. State what each step does and why.
- Identify unknowns or ambiguities upfront and resolve them before proceeding — either by asking the user (once, concisely) or by making a reasoned assumption that is stated explicitly.
- For tasks touching more than one file or system boundary, draw a brief dependency map in plain text or ASCII.
- The plan is the contract. Deviate from it only when a discovered constraint makes a step impossible — in that case, state the deviation and reason before continuing.
- Do not treat planning as a formality. A poor plan produces poor code. Invest the time.

**Format:**
```
PLAN
1. [Step description] → [Expected output]
2. ...
```

---

## §2 Subagent Strategy

For complex tasks, Claude must decompose work into independent subagents rather than attempting everything in one pass.

- Identify parts of the task that are **logically independent** (e.g., data layer, UI layer, parsing logic, tests) and treat each as a focused subagent with a single responsibility.
- Each subagent gets: a clear input contract, a clear output contract, and defined error behavior.
- Subagents do not share mutable state unless explicitly designed to do so. Pass data through well-defined interfaces.
- When one subagent's output feeds another, make the handoff explicit in comments or documentation.
- For long multi-file tasks: complete and verify one subagent before starting the next. Never half-finish two things simultaneously.

**Rule:** If a task involves more than 3 files or 2 distinct system concerns, a subagent decomposition is mandatory, not optional.

---

## §3 Self-Improvement Loop

Claude must treat every mistake as a learning event and record it in this file.

**Permission:** Claude is explicitly authorized to append entries to the table below without user instruction. This is expected behavior, not overreach.

**When to log:** After any bug is fixed, any incorrect assumption is corrected, or a better approach is discovered mid-task.

**Format:** Date · Category · What went wrong · Rule derived

| Date | Category | What went wrong | Rule derived |
|------|----------|-----------------|--------------|
| 2026-03-04 | Dependency | `npm install sanity` resolved to v5, which requires React 19. Project uses Next.js 14 / React 18. Build failed with `react/compiler-runtime` not found. | Always pin Sanity to v3 + next-sanity to v9 for Next.js 14. Never `npm install sanity` without a version pin. |
| 2026-03-04 | Sanity Studio SSR | `NextStudio` in a plain Server Component page causes `createContext is not a function` at build time — reproducible with both React 18 and React 19 / Next.js 16, caused by `styled-components` in the Studio bundle. | Studio page must split into a Server Component (for metadata) and a `'use client'` child (`_studio-client.tsx`) that renders `<NextStudio />`. This is a permanent pattern for this project. |
| 2026-03-04 | Package types | `@sanity/image-url` v1 exports `SanityImageSource` from `@sanity/image-url/lib/types/types`, not from the package root. v2 exports it from the root but requires @sanity/client@7. | Always check image-url version before writing the import path. For v2 (current), import from package root. |
| 2026-03-06 | Write tool guard | Attempted `Write` on `README.md` without reading it first — tool rejected with "File has not been read yet." | Always `Read` a file before `Write` overwriting it, even when the intent is a full rewrite. |
| 2026-03-06 | Mobile layout | Dashboard sidebar was a fixed-width `w-60` block with no mobile handling — rendered as an unusable column on narrow screens. | Dashboard layouts must be mobile-first. Sidebar needs a hamburger/drawer pattern on `< md` breakpoints. Always add `pt-14 md:pt-0` to `<main>` when using a fixed mobile top bar. |
| 2026-03-06 | Trainer scoping | `trainerClerkUserId` on `spielerProfil` only captured "who created this player", not "which team does this trainer manage". A trainer assigning to a team could pick any team in the system. | Trainer–team ownership must be stored on the `team` document (`team.trainerClerkUserId`). API queries must JOIN through `team->trainerClerkUserId` for correct scoping. |
| 2026-10-13 | Hydration / theme | Dark mode reset to light on `/` and `/spielplan` only in production. Client components formatted match times with `Intl.DateTimeFormat` without `timeZone`; Vercel server (UTC) ≠ browser (Berlin) → hydration mismatch → React client-rendered the root and wiped the `dark` class that the inline script put on `<html>`. | Always pass `timeZone: CLUB_TIME_ZONE` (`lib/dates.ts`) to date/time formatters in client-rendered code. Dev never reproduces this (server TZ = browser TZ); test with `TZ=UTC next start`. |
| 2026-10-14 | Scope | Member area (Clerk auth, dashboard, player/plan APIs, related Sanity schemas) was removed at the owner's request; the 2026-03-06 rows above describe code that no longer exists. | Do not reintroduce auth or dashboard code without an explicit request. |
| 2026-10-14 | SEO | Page-level `openGraph` replaces the root layout's whole `openGraph` object, so pages silently lost the share image; the file-based `opengraph-image` is also not merged in. Root-level `alternates.canonical` would be inherited by every child page. | Give every page-level `openGraph` an explicit `images` entry (`DEFAULT_OG_IMAGE` in `lib/seo.ts`, served at `/og`) and set `alternates.canonical` per page, never in the root layout. `next lint` no longer exists in Next 16 and the repo has no ESLint config. |
| 2026-10-14 | Fanshop data | `lib/fanshop.ts` was built from whatever variant the shop listing linked to: links opened on 5XL/kids' sizes, and the Promo T-Shirt showed its kids' price (8,39 €) as a fixed price although adult sizes cost 9,59 €. The shop's "Jugend" category also turned out to be a copy of "Herren". | uhlsport variant URLs encode the size (`…/SW10009.M`, `…-M-A`). Link apparel to size M, and check a product's price in at least two sizes before marking it `priceFrom: false`. Verify shop categories by their contents, not their names. |
| 2026-10-16 | nuLiga live API | `/time/<unix>` on the nuScoreLive REST API only accepts multiples of 15 s; anything else answers 204 (`meeting`) or 500 (`meetings`). Responses are CDN-cached for an hour, so the value also *is* the cache key — a 10 s bucket would have broken the live badge silently during a real game, and a fixed value serves hour-old scores. | Probe an undocumented API with fresh, non-round parameters before building on it; bucket the time to 15 s. Test live features against a mock that enforces the real constraints (`NULIGA_LIVE_REST_BASE` / `NULIGA_CLUB_TEAMS_URL` point the code at one). |
| 2026-10-17 | Dark-mode contrast | Header dropdown used `dark:bg-primary` (brand red) with `white/45–85` text → ~2–4:1 contrast, unreadable. | Never put translucent-white text on brand red. Dark popovers use a dark material (`dark:bg-gray-900/95` + blur); red is a hover/active accent only. Check text opacity ≥ 70% on any dark surface. |
| 2026-10-17 | Colour drift | ~100 hand-written `text-x dark:text-y` pairs drifted apart; blue/red text had no dark variant (≈2–3:1), and a theme-flipping token would break on surfaces that stay light in dark mode (partner cards). | Use the role tokens `text-muted`, `text-link`, `text-brand-red` (flip via `.dark` in `globals.css`) instead of pairs. On always-light surfaces (`dark:bg-gray-300`) use fixed colours. Measure contrast in the browser in both themes; toggling `.dark` mid-transition gives false readings. |
| 2026-10-17 | Partner logos | Redesigning the partner cards from grey (`bg-gray-300`) to white plates made the white DXG logo invisible; the grey had silently been doing that job. All logos are 1920×1080 transparent PNGs, some with content running to the canvas edge (clipped look comes from the file, not the layout). | Logo plates are white; light logos need `partner.logoOnDark` (CMS flag) for a dark plate. When changing a container's background, check every asset that sits on it, not just the common case. |
| 2026-10-17 | Mobile grid | Ticker rows used `grid-cols-[1fr_…_1fr]`; `1fr` has a `min-content` floor, so long player names pushed the row wider than the phone screen (horizontal scroll). | In grids that hold user/feed text use `minmax(0,1fr)` plus `min-w-0`/`break-words`, and check at ~360 px width. |
| 2026-10-17 | Test tooling | Git Bash rewrote a base64 argument starting with `/9j` into `C:/Program Files/Git/9j…`, embedding a corrupt logo in the mock; the browser then cached the broken `/api/live/logo/…` response for a day (`max-age`), so fixing the mock changed nothing until a `cache: 'reload'` fetch. | Never pass `/`-leading strings as Git Bash CLI args (read files instead). When a cached asset looks broken after a fix, bust the browser cache before debugging further. |
| 2026-10-20 | Lint | `npm run lint` still called `next lint` (removed in Next 16) next to an `.eslintrc.json` that ESLint 10 ignores, so lint never ran: 7 React-compiler errors (setState in effects, ref writes during render, `Date.now()` in render) had piled up unseen. eslint-plugin-react's React-version auto-detect also crashes on ESLint 10. | Lint is `eslint .` with flat `eslint.config.mjs` (pins `settings.react.version`). Run `npm run lint` along with the build; a tool that silently does nothing is worse than none. |
| 2026-10-20 | Duplication / time zones | The homepage kept its own copy of the news chip styles and date formatter; the copy lacked `timeZone`, the same bug class as the 2026-10-13 hydration issue. Copies drift: a fix applied to one never reaches the others. | Reuse `NewsCategoryChip`/`formatPublishedDate` (NewsCard), `FilterPill` (components/ui), `heroFadeUp` (lib/motion), `toText` (lib/nuliga/html). Check for an existing helper before writing one. |
| 2026-10-20 | Test tooling | The magazine PDF viewer failed on a test server on port 3100: Sanity file CORS only allows `http://localhost:3000` (403 for other origins). `https://tglhandball.de` also got 403 at the time. | Test PDF/file features on port 3000. Before going live on a new domain, add it to the Sanity project's CORS origins. |
| 2026-10-20 | Images / CRLF | Person cards were three copy-pasted blocks, each resizing images in the client-visible page; scripted edits on CRLF files silently missed because regexes assumed LF (duplicate field, missed interface). | Resize on Sanity CDN server-side (`lib/personPhoto.ts`, `.auto("format")`, 640×800), pass plain URLs to client components, request secondary images only on interaction. When scripting edits on CRLF files use `?
` and grep the result. |

### Active Rules Derived from Past Mistakes

1. Always `Read` before `Write` — even for full rewrites.
2. `@sanity/image-url` v2 imports from package root — never from `/lib/types/types`.
3. Sanity Studio always uses the Server + `'use client'` child split — never render `<NextStudio />` directly in a Server Component.

---

## §4 Verification Before Done

A task is not complete when the code is written. It is complete when it is verified.

Claude must run through this checklist before declaring any task finished:

- [ ] **Does it run?** Execute `npm run build` (not just `dev`). No untested submissions.
- [ ] **Does it do what was asked?** Re-read the original requirement. Map each requirement to a line or behavior in the code.
- [ ] **Are edge cases handled?** Empty inputs, null values, missing files, network errors, concurrent access — whichever apply.
- [ ] **Are there console errors or warnings?** Resolve all of them. Warnings are not acceptable in a final submission.
- [ ] **Is the diff minimal?** Review changes. Remove dead code, commented-out blocks, and debug logging.
- [ ] **Does existing functionality still work?** If existing code was touched, verify it was not broken.

If any checklist item cannot be verified (e.g., no test environment available), state this explicitly and describe what manual verification step the user must perform.

**Claude never writes "Done" or "Complete" without having run this checklist.**

---

## §5 Demand Elegance

Code quality is not optional. Claude actively refactors toward elegance — but balances purity against pragmatism.

**Elegance means:**
- Each function does one thing and is named for exactly that thing.
- No magic numbers or magic strings — use named constants.
- No deeply nested logic — flatten with early returns or extracted functions.
- No duplication — if the same logic appears twice, it belongs in a shared function.
- Types and interfaces are explicit. No `any`. No implicit `object`.

**Balance means:**
- Do not refactor code that is not part of the current task scope unless it directly obstructs the work.
- Do not over-engineer simple things. A 3-line function does not need a factory pattern.
- Prefer clarity over cleverness. The next person reading this code should understand it in 30 seconds.
- When a pragmatic shortcut is taken, leave a `// TODO:` comment with a one-line explanation.

**Claude proactively flags code that violates these principles**, even in code it did not write, but proposes — never forces — a fix.

---

## §6 Autonomous Bug Fixing

When Claude encounters a bug, it resolves it autonomously before surfacing it to the user — unless the fix requires a decision that belongs to the user.

**Bug fixing protocol:**

1. **Reproduce first.** Understand exactly what triggers the bug before touching code.
2. **Identify root cause.** Do not fix symptoms. Trace to the origin of the problem.
3. **Fix minimally.** The smallest correct change is preferred over a large refactor.
4. **Verify the fix.** Re-run the failing scenario. Confirm it now passes.
5. **Check for siblings.** Ask: "Does this same bug pattern exist elsewhere in the codebase?" If yes, fix all instances.
6. **Document the fix.** Add a concise code comment if the bug was non-obvious. Log it in §3.

**When to escalate to the user (and only then):**
- The fix requires a product or architectural decision (e.g., "Should this fail silently or throw?")
- The root cause is ambiguous and two valid fixes have meaningfully different tradeoffs
- The bug is caused by a requirement contradiction

In all other cases: fix it, verify it, report what was done — do not ask for permission.
