/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ['images.pexels.com', 'localhost'],
  },
  env: {
    PORTAL_TYPE: 'seller',
  },
  transpilePackages: ['cbx']
}

module.exports = nextConfig 
