/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@careermatch/ui', '@careermatch/shared', '@careermatch/database'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    domains: [],
  },
}

module.exports = nextConfig
