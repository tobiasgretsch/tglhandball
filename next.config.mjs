/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Explicitly set workspace root to silence the multiple-lockfile warning
    root: process.cwd(),
  },
};

export default nextConfig;
