import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@barcutx/shared-types',
    '@barcutx/shared-constants',
    '@barcutx/shared-utils',
    '@barcutx/design-tokens',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
