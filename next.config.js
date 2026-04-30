/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three'],
  poweredByHeader: false,
  compress: true,
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig
