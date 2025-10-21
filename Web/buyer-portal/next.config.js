/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false,
  images: {
    domains: ['images.pexels.com'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
