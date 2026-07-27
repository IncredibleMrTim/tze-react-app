import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.4.33",
    "viii-palestinian-knife-display.trycloudflare.com",
    "photograph-photo-anywhere-respect.trycloudflare.com",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
