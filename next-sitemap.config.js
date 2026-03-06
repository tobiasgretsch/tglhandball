/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://tglhandball.de",
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/studio", "/sign-in", "/sign-up", "/onboarding", "/dashboard", "/api"] },
    ],
  },
  // Exclude internal/private routes from the sitemap
  exclude: [
    "/studio",
    "/studio/*",
    "/sign-in",
    "/sign-in/*",
    "/sign-up",
    "/sign-up/*",
    "/onboarding",
    "/dashboard",
    "/dashboard/*",
    "/api/*",
  ],
  // Dynamic routes are handled by generateStaticParams in each page file.
  // We add them here as well so next-sitemap picks them up even if the
  // build output doesn't expose them automatically.
  additionalPaths: async (config) => {
    const { createClient } = require("@sanity/client");

    const sanityClient = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
      useCdn: false,
      apiVersion: "2024-01-01",
    });

    const [newsSlugs, teamSlugs] = await Promise.all([
      sanityClient
        .fetch(`*[_type == "news" && defined(slug.current)]{ "slug": slug.current }`)
        .catch(() => []),
      sanityClient
        .fetch(`*[_type == "team" && defined(slug.current)]{ "slug": slug.current }`)
        .catch(() => []),
    ]);

    const now = new Date().toISOString();

    const newsPaths = newsSlugs.map(({ slug }) => ({
      loc: `/news/${slug}`,
      changefreq: "weekly",
      priority: 0.7,
      lastmod: now,
    }));

    const teamPaths = teamSlugs.map(({ slug }) => ({
      loc: `/teams/${slug}`,
      changefreq: "monthly",
      priority: 0.6,
      lastmod: now,
    }));

    return [...newsPaths, ...teamPaths];
  },
};
