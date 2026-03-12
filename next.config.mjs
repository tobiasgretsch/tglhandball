/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Explicitly set workspace root to silence the multiple-lockfile warning
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000, // 30 days — safe for content-addressed Sanity URLs
  },
};

export default nextConfig;
