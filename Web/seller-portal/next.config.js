/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.pexels.com', 'localhost'],
  },
  env: {
    PORTAL_TYPE: 'seller',
  },
}

module.exports = nextConfig 