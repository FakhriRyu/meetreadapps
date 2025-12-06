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
  // Env vars configuration
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://zmfoiuhjdsozeuriwzkb.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZm9pdWhqZHNvemV1cml3emtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NzU4ODYsImV4cCI6MjA3NzU1MTg4Nn0.CKdURB8NHZ8Bzp4MS-xxF-nuVOrSbbgGkEgz_iK37nM",
  },
  productionBrowserSourceMaps: false,
};

export default nextConfig;
