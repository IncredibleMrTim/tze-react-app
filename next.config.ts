import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.4.33",
    "viii-palestinian-knife-display.trycloudflare.com",
    "postcards-electricity-animated-filename.trycloudflare.com",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
