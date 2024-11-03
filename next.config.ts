import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/ball-packing-game',
  images: {
    unoptimized: true,
  },
}

export default nextConfig