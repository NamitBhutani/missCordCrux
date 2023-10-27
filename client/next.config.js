/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: false }; //set false coz it was triggering useEffect to load twice on every page load

module.exports = nextConfig;
