import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['react-map-gl', 'mapbox-gl', 'maplibre-gl'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // ← ADD THIS
  async rewrites() {
    return [
      {
        source: '/proxy/insecam/:path*',
        destination: 'http://www.insecam.org/:path*',
      },
    ];
  },
};

export default nextConfig;
