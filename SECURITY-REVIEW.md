# Security & Hosting Review — tglhandball.de

**Date:** 2026-10-23 · **Scope:** the Next.js site (`main` @ `4a43f12`) as deployed at https://tglhandball.vercel.app
**Basis:** the checklist from the web developer, checked against the repository, the live site (header and route probes) and `npm audit`.
**Not a legal or penetration-test report.** Items marked *unverified* need a look in a dashboard (Vercel, Sanity, GitHub) that I cannot reach from here.

---

## 1. Summary

| # | Item | Status | Action |
|---|------|--------|--------|
| 1 | Server in EU | ✅ Done | Functions in `fra1` (Frankfurt) since today; Sanity dataset region *unverified* |
| 2 | HTTPS enforced | ✅ Done | HTTP → HTTPS 308, HSTS 2 years + preload |
| 3 | Daily backups | ⚠️ Partial | Code is in Git; **CMS content has no own backup** |
| 4 | DDoS / WAF | ✅ Platform | Vercel edge mitigation; no custom WAF rules |
| 5 | Monitoring & security updates | ❌ **Open** | **Next.js 16.1.6 has critical advisories — upgrade** |
| 6 | 2FA for admin access | ⚠️ *Unverified* | Delegated to Sanity / Vercel / GitHub accounts |
| 7 | Rate-limit logins | ✅ N/A | No own login; delegated to Sanity |
| 8 | Strong passwords & roles | ⚠️ *Unverified* | Sanity roles, token scope |
| 9 | SQL injection | ✅ N/A | No SQL database; GROQ is parameterised |
| 10 | XSS | ✅ Good | React escaping; two safe `dangerouslySetInnerHTML` uses |
| 11 | Secure uploads | ✅ N/A | No upload feature on the site |
| 12 | Security monitoring / logs | ⚠️ Partial | Vercel logs only; no alerting |
| + | **Förderverein form (new finding)** | ❌ **Open** | Collects IBAN/SEPA data, backend does not exist |

**Top three actions**
1. Upgrade `next` (16.1.6 → 16.4.2) and the other vulnerable production dependencies.
2. Do not publish the Förderverein form until its backend, data protection and placeholders are finished.
3. Set up a content backup for Sanity and check 2FA on Sanity, Vercel and GitHub.

---

## 2. Item-by-item findings

### 2.1 Server in the EU — ✅ Done (one point to verify)

- **Before today** the serverless functions ran in `iad1` (Washington, USA), the Vercel default. The header was `x-vercel-id: fra1::iad1::…`.
- **Fixed in `4a43f12`:** `vercel.json` now has `"regions": ["fra1"]`. Live check afterwards: `x-vercel-id: fra1::fra1::…`.
- Static pages and the CDN are served from the nearest edge location. Static assets are not "stored" in one country; this is normal for any CDN.
- **Still to verify (Sanity dashboard):** which region hosts the dataset. Sanity publishes the region per project; if the club wants a strict "EU only" statement, confirm it there.
- **Data protection note:** Vercel and Sanity are US companies. Both offer a Data Processing Addendum and participate in the EU-US Data Privacy Framework. Make sure both DPAs are accepted and are mentioned in the Datenschutzerklärung. The privacy page currently mentions handball.net and OpenStreetMap; check that hosting and CMS providers are listed too.

### 2.2 HTTPS enforced — ✅ Done

- `http://…` answers `308 Permanent Redirect` to `https://…`.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (2 years). The TLS certificate is issued and renewed automatically by Vercel.
- **Note:** `preload` means the domain can be added to browser preload lists. That is fine once `tglhandball.de` is fully on HTTPS, including all subdomains (e.g. a mail or old WordPress subdomain). Check this before the DNS cutover.

### 2.3 Regular (daily) backups — ⚠️ Partial

| Asset | Where it lives | Backup |
|-------|----------------|--------|
| Code & configuration | GitHub (`tobiasgretsch/tglhandball`) | ✅ Git history; every deploy is reproducible |
| Deployments | Vercel | ✅ Previous deployments can be re-promoted (instant rollback) |
| **CMS content** (news, teams, matches, archive, gallery, settings) | Sanity dataset `production` | ⚠️ Sanity keeps document history for a plan-dependent time; **no scheduled export** |
| Images / PDFs | Sanity asset store | ⚠️ Same as above |
| Environment variables / secrets | Vercel project settings | ❌ Not backed up anywhere |

**Recommendations**
- Add a **daily export** of the dataset, for example a GitHub Action running `npx sanity dataset export production` to a private storage location, keeping 14–30 days. Cost: free.
- Keep an offline copy of the environment variable *names* and where each value comes from (the values themselves go in the club's password manager).
- The old WordPress site should be backed up **once, completely** before the DNS switch. After the switch it is no longer reachable by visitors.

### 2.4 DDoS protection & Web Application Firewall — ✅ Platform level

- Vercel provides network-level DDoS mitigation on every plan, and the pages are served from a CDN cache (most requests never reach a function).
- The WAF is available as a Vercel feature (custom rules, rate limits, bot rules). The number of rules and rate-limit features depend on the plan — *unverified for this account*.
- **Application-level exposure** (how much a flood could cost or break):

  | Route | Protection |
  |-------|-----------|
  | `/api/live`, `/api/live/[id]` | CDN-cached (`s-maxage`), IDs validated; nuLiga is called at most a few times a minute |
  | `/api/nuliga/report/[meeting]` | ID must match `^\d{1,12}$`; **no rate limit** and the response is only cached in the browser (`max-age=3600`, no `s-maxage`). A flood of valid IDs would make the function download PDFs from nuLiga each time. |
  | `/api/live/logo/[logoId]` | Validated, CDN-cached for 7 days |
  | `/api/cron/sync-matches` | Requires `Authorization: Bearer <CRON_SECRET>` (401 without) |

- **Recommendation:** add `s-maxage=3600` to the report proxy so the CDN absorbs repeats, and (if the plan allows) a Vercel WAF rate-limit rule for `/api/*`.

### 2.5 Automatic monitoring & security updates — ❌ **Open**

Vercel patches the platform (servers, OS, runtime) automatically — nothing to do there. **The application's own dependencies are not updated automatically**, and they are behind.

`npm audit` (production dependencies only): **51 findings — 2 critical, 34 high, 13 moderate, 2 low.**

| Package | Severity | Installed | What it means for this site |
|---------|----------|-----------|-----------------------------|
| **`next`** | Critical (many advisories) | 16.1.6 | Includes DoS in Server Components / Image Optimization, cache poisoning, middleware bypass, and **remote code execution advisories for the Image Optimization API (AVIF/SVG)**. The site enables AVIF in `next.config.mjs`. On Vercel, the platform layer reduces some exposure (and the project has no middleware or Server Actions), but this is still the single most important update. **Fix: 16.4.2 is available (`npm install next@latest`).** |
| `sharp` | High (libvips / libheif / librsvg) | transitive | Image processing; fixed by the `next` update or by raising `sharp`. |
| `dompurify` | High (XSS bypasses) | transitive | Pulled in via the Sanity Studio bundle (used inside `/studio`, not by public pages). |
| `postcss` | High | direct | Build-time only; update with the toolchain. |
| `undici`, `tar`, `ws`, `lodash`, `micromatch`, `braces`, … | High/Critical | transitive | Mostly Sanity CLI / build tooling; not executed on visitors' requests. Update together with `sanity`. |
| `next-sitemap` | High (via `fast-glob`) | direct | Build-time only. |

**Honest risk assessment:** most of the 51 items are in build and CMS-studio tooling and are not reachable by website visitors. The `next` package is the exception, because it is the runtime that serves every request. It should be updated first, then built, linted and checked on the staging (`develop`) deployment before merging to `main`.

**Recommendations**
- Upgrade `next` → `16.4.2` now; then run `npm audit fix` for non-breaking items and review the remainder.
- Turn on **GitHub Dependabot** (security updates) so the repository opens a pull request when an advisory appears. Free, five minutes.
- **Monitoring:** `@vercel/speed-insights` measures performance only. For availability, add a free uptime monitor (e.g. UptimeRobot) on `/` and `/api/live`. `/api/live` already reports `partial: true` when nuLiga is down — useful as an alert signal.

### 2.6 Two-factor authentication for admin access — ⚠️ *Unverified*

The site has **no login of its own** (the member area was removed on 2026-10-14). Administrative access exists in four places, all external accounts:

| Account | What it controls | Check |
|---------|------------------|-------|
| **Sanity** (`/studio`) | All content, can create/delete documents | Which login provider is used (Google/GitHub/e-mail)? Enable 2FA at that provider; Sanity organisations can require SSO on higher plans. |
| **Vercel** | Deployments, env vars, domains, logs | Enable 2FA (Account Settings → Security). Use a team with named members rather than one shared login. |
| **GitHub** | Source code, can trigger deploys by pushing to `main` | Enable 2FA; consider branch protection on `main`. |
| **Domain registrar / DNS** | Controls where `tglhandball.de` points | Enable 2FA; a hijacked DNS entry is the most damaging attack on a club site. |

I could not verify any of these from here. **Action:** the person who owns each account should confirm 2FA is on and list who has access.

Note: `/studio` is reachable by anyone (HTTP 200), but only shows a Sanity login screen. This is how Sanity works; no content is exposed without logging in.

### 2.7 Limit login attempts — ✅ Not applicable to this code

There is no username/password form on the site, so there is nothing to brute-force. Login throttling for the CMS is handled by Sanity, and for hosting by Vercel/GitHub. The only secret-protected endpoint is the cron route, which needs a long random `CRON_SECRET` — a long random value makes guessing impractical; make sure it is at least 32 random characters.

### 2.8 Secure passwords & role rights — ⚠️ *Unverified*

- **Sanity roles:** check Project → Members. Editors should have *Editor*, only one or two people *Administrator*. Remove former members.
- **API tokens:** `SANITY_API_TOKEN` is used server-side only (`lib/sanity-write.ts`, not imported by client components). Confirm the token has the minimum role needed (*Editor*, not *Administrator*) and rotate it if it was ever pasted into chat, tickets or screenshots.
- **Secrets in Git:** `.env*.local` is git-ignored and only `.env.local.example` is tracked. ✅
- Use a password manager for the club; no shared passwords by e-mail.

### 2.9 SQL injection — ✅ Not applicable

- There is **no SQL database**. Content is in Sanity and queried with GROQ.
- All dynamic values are passed as GROQ **parameters**, not concatenated into query strings (I found no template-literal queries outside `lib/queries.ts`).
- Probe results on the live site: `/api/live/1' OR 1=1` → 404, non-numeric report ID → 400. Route parameters are validated by strict patterns (`isValidMeetingId`, `isValidLogoId`, `^\d{1,12}$`).

### 2.10 XSS protection — ✅ Good

- React escapes all rendered text by default.
- Only two uses of `dangerouslySetInnerHTML`:
  - `app/layout.tsx:95` — a fixed theme-switching script (no user input).
  - `components/ui/JsonLd.tsx:10` — JSON-LD from CMS data with `<` escaped to `<`, which prevents breaking out of the `<script>` tag. ✅
- CMS rich text is rendered through Portable Text components, not raw HTML.
- Headers added today: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`.
- **Gap:** no `Content-Security-Policy`. A CSP is the strongest second line of defence, but this site uses inline scripts (theme script, JSON-LD) and embeds third-party content after consent (handball.net, OpenStreetMap), so a correct policy needs nonces and careful testing. Recommended as a follow-up, in *report-only* mode first.

### 2.11 Secure file uploads — ✅ Not applicable (today)

The public site has no upload feature. Files are uploaded only by editors inside Sanity Studio, which validates and stores assets on its own CDN (`cdn.sanity.io`), not on the web server. The Förderverein form (see 3) has no file field.

### 2.12 Security monitoring / logs — ⚠️ Partial

- Server errors are logged with `console.error` (`[live]`, `[sync-matches]`, `[archive-sweep]`) and appear in Vercel → Logs. Retention on lower plans is short (hours to a day).
- Nothing alerts anyone when something fails (for example the nightly cron).
- **Recommendations:** enable Vercel *Log Drains* or email alerts if the plan allows; otherwise check the cron's result in the Vercel dashboard weekly; add the uptime monitor from 2.5. Do not log personal data (names, IBAN) — currently none is logged.

---

## 3. Additional findings (not on the list)

### 3.1 ❌ Förderverein form collects bank data, but has no backend and placeholder data

- `components/sections/FoerdervereinForm.tsx` collects name, address and **IBAN with a SEPA direct-debit mandate**. It posts to `/api/foerderverein`.
- **That endpoint does not exist** (`POST /api/foerderverein` → 404 on the live site), so submissions currently fail.
- `lib/foerderverein.ts` still contains placeholders: `[Name des Fördervereins]`, `[Straße Hausnummer]`, `DE00ZZZ00000000000` (creditor ID), fee `0`.
- The page `/foerderverein` is deployed and linked in the code. A form that asks for an IBAN while the legal text and creditor data are placeholders must **not** go public.
- **Before launch:** (a) build the endpoint (server-side validation, rate limit, spam protection — the form already has a honeypot field), (b) decide where the data goes (encrypted e-mail to the treasurer or a restricted database — **not** the public Sanity dataset), (c) fill in the real creditor data, (d) cover it in the Datenschutzerklärung, (e) have the SEPA mandate text reviewed.
- **Short-term option:** hide the page (remove from navigation and set `noindex`) until it is ready.

### 3.2 ⚠️ Legal pages

`app/(site)/datenschutz/content.ts:7` still has `TODO: Vor Veröffentlichung juristisch prüfen lassen`. See the earlier legal discussion; reviewed texts are required before the cutover.

### 3.3 ⚠️ Missing hardening headers

Added today: `nosniff`, frame protection, referrer policy, permissions policy. Still missing: `Content-Security-Policy` (see 2.10) and `Cross-Origin-Opener-Policy` (optional).

### 3.4 ℹ️ Third-party requests

The homepage links to about 25 external sponsor sites, Facebook, Instagram and YouTube (plain links, no embeds loaded at page view). Embeds (handball.net, OpenStreetMap) are blocked until consent. ✅

---

## 4. What was verified

| Check | Result |
|-------|--------|
| HTTP → HTTPS redirect | 308 ✅ |
| HSTS header | 2 years, preload ✅ |
| Function region | `fra1` ✅ |
| Added security headers | present ✅ |
| `/api/cron/sync-matches` without secret | 401 ✅ |
| Route-parameter injection (`/api/live/1' OR 1=1`, `/api/nuliga/report/abc`) | 404 / 400 ✅ |
| `dangerouslySetInnerHTML` usage | 2, both safe ✅ |
| Secrets in Git | none tracked ✅ |
| `npm audit --omit=dev` | 2 critical, 34 high ❌ |
| `POST /api/foerderverein` | 404 ❌ |
| 2FA / roles / dataset region / backups / WAF plan | not verifiable here |

---

## 5. Recommended order of work

1. **Today:** `npm install next@latest` (16.4.2), build, lint, test on `develop`, then merge to `main`. Enable Dependabot.
2. **Before the domain cutover:** back up the WordPress site; verify 2FA on DNS registrar, Vercel, GitHub, Sanity; review Sanity members and token scope; legal review of Impressum/Datenschutz; set `NEXT_PUBLIC_SITE_URL` and Sanity CORS.
3. **Before the Förderverein goes public:** implement the backend, fill placeholders, update the privacy policy — or hide the page.
4. **Within a month:** scheduled Sanity export, uptime monitor, `s-maxage` on the report proxy, WAF rate-limit rule, report-only CSP.
