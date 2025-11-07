/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['images.pexels.com', 'localhost'],
  },
  env: {
    PORTAL_TYPE: 'seller',
  },
}

module.exports = nextConfig 
