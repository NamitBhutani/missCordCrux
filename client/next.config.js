/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
}; //reactStrictMode set false coz it was triggering useEffect to load twice on every page load

module.exports = nextConfig;
