// German is unprefixed, other languages live under /<code>. Keep in sync with i18n/routing.ts.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tglhandball.de";
const DEFAULT_LOCALE = { code: "de", hreflang: "de-DE" };
const OTHER_LOCALES = [{ code: "en", hreflang: "en-GB" }];
const ALL_LOCALES = [DEFAULT_LOCALE, ...OTHER_LOCALES];

const alternateRefs = (base) =>
  ALL_LOCALES.map((locale) => ({
    href: `${SITE_URL}${publicPath(locale, base)}`,
    hreflang: locale.hreflang,
    hrefIsAbsolute: true,
  }));

// The build lists every page under its internal /<code>/ prefix (also German); public URLs drop it for German.
const internalPath = (locale, path) => `/${locale.code}${path === "/" ? "" : path}`;
const publicPath = (locale, path) => (locale.code === DEFAULT_LOCALE.code ? path : internalPath(locale, path));
const splitLocale = (path) => {
  const locale = ALL_LOCALES.find(({ code }) => path === `/${code}` || path.startsWith(`/${code}/`));
  return locale ? { locale, base: path.slice(locale.code.length + 1) || "/" } : { locale: DEFAULT_LOCALE, base: path };
};

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  // Static pages have no real modification date; omit lastmod instead of faking it.
  autoLastmod: false,
  robotsTxtOptions: {
    policies: [{ userAgent: "*", allow: "/", disallow: ["/studio", "/api"] }],
  },
  // Exclude internal/private routes from the sitemap
  exclude: [
    "/studio",
    "/studio/*",
    "/api/*",
    // Redirects and noindex pages do not belong in the sitemap.
    "/kontakt",
    "/verein",
    // Live pages are real-time views, not indexable content.
    "/live",
    "/live/*",
    "/impressum",
    "/datenschutz",
    ...ALL_LOCALES.flatMap(({ code }) => [
      `/${code}/kontakt`,
      `/${code}/verein`,
      `/${code}/live`,
      `/${code}/live/*`,
      `/${code}/impressum`,
      `/${code}/datenschutz`,
    ]),
  ],
  // Every URL lists all language versions (hreflang), including itself.
  transform: async (config, path) => {
    const { locale, base } = splitLocale(path);
    return {
      loc: publicPath(locale, base),
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: alternateRefs(base),
    };
  },
  // Dynamic routes are handled by generateStaticParams in each page file.
  // We add them here as well so next-sitemap picks them up even if the
  // build output doesn't expose them automatically.
  additionalPaths: async () => {
    const { createClient } = require("@sanity/client");

    const sanityClient = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
      useCdn: false,
      apiVersion: "2024-01-01",
    });

    const [newsSlugs, teamSlugs, gameIds] = await Promise.all([
      sanityClient
        .fetch(`*[_type == "news" && defined(slug.current)]{ "slug": slug.current, "updated": _updatedAt }`)
        .catch(() => []),
      sanityClient
        .fetch(`*[_type == "team" && defined(slug.current)]{ "slug": slug.current, "updated": _updatedAt }`)
        .catch(() => []),
      // Youth games are archived without player names but kept out of search engines.
      sanityClient
        .fetch(`*[_type == "matchArchive" && indexable == true]{ meetingId, "updated": archivedAt }`)
        .catch(() => []),
    ]);

    // additionalPaths bypass transform, so they carry their final URL and language links.
    const everyLocale = (entries) =>
      entries.flatMap((entry) =>
        ALL_LOCALES.map((locale) => ({ ...entry, loc: publicPath(locale, entry.loc), alternateRefs: alternateRefs(entry.loc) })),
      );

    const newsPaths = newsSlugs.map(({ slug, updated }) => ({
      loc: `/news/${slug}`,
      changefreq: "weekly",
      priority: 0.7,
      lastmod: updated,
    }));

    const teamPaths = teamSlugs.map(({ slug, updated }) => ({
      loc: `/teams/${slug}`,
      changefreq: "monthly",
      priority: 0.6,
      lastmod: updated,
    }));

    const gamePaths = gameIds.map(({ meetingId, updated }) => ({
      loc: `/spielplan/${meetingId}`,
      changefreq: "never",
      priority: 0.4,
      lastmod: updated,
    }));

    return everyLocale([...newsPaths, ...teamPaths, ...gamePaths]);
  },
};
