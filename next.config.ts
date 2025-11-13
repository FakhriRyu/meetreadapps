import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    // Optimasi image loading
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Optimasi performance
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Optimasi untuk production
  swcMinify: true,
  productionBrowserSourceMaps: false,
  // Optimasi bundle
  experimental: {
    optimizePackageImports: ["@prisma/client"],
  },
};

export default nextConfig;
