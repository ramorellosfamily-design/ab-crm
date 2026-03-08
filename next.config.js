/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // Disable server-side features not available on Cloudflare Pages static
  reactStrictMode: true,
};

module.exports = nextConfig;
