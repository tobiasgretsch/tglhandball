/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://tglhandball.de",
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
  ],
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

    const [newsSlugs, teamSlugs] = await Promise.all([
      sanityClient
        .fetch(`*[_type == "news" && defined(slug.current)]{ "slug": slug.current, "updated": _updatedAt }`)
        .catch(() => []),
      sanityClient
        .fetch(`*[_type == "team" && defined(slug.current)]{ "slug": slug.current, "updated": _updatedAt }`)
        .catch(() => []),
    ]);

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

    return [...newsPaths, ...teamPaths];
  },
};
