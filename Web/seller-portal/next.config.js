/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['images.pexels.com', 'localhost'],
  },
  env: {
    PORTAL_TYPE: 'seller',
  },
}

module.exports = nextConfig 
