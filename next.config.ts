import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.4.33",
    "viii-palestinian-knife-display.trycloudflare.com",
    "photograph-photo-anywhere-respect.trycloudflare.com",
  ],
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  // serverExternalPackages keeps these un-bundled, but Next's output file
  // tracer still can't see @sparticuz/chromium's binary — it's resolved via
  // a dynamic path at runtime (chromium.executablePath()), not a traceable
  // static import — so it gets dropped from the deployed function unless
  // explicitly included here. See github.com/Sparticuz/chromium#bundler-configuration.
  outputFileTracingIncludes: {
    "/api/fpn/pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
    "/api/email/fpn": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
