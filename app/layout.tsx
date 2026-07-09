import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "./navigation";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Tauranga Zinc Electroplaters",
  description: "Job management system for TZE",
  icons: {
    icon: [
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-48x48.png",
        sizes: "48x48",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-16x16-dark.png",
        sizes: "16x16",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/favicon-32x32-dark.png",
        sizes: "32x32",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/favicon-48x48-dark.png",
        sizes: "48x48",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [
      {
        url: "/favicon-192.png",
        sizes: "192x192",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-192-dark.png",
        sizes: "192x192",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body>
        <div className="w-full max-w-[430px] min-h-screen bg-white rounded-2xl overflow-hidden shadow-lg flex flex-col mx-auto">
          {/* Header */}
          <div className="fixed top-0 w-full max-w-[430px] left-1/2 -translate-x-1/2 z-50 bg-white border-b border-gray-200 px-4 py-3.5 flex items-center justify-between">
            <h1 className="text-base font-bold text-primary">
              Tauranga Zinc Electroplaters
            </h1>
            <span className="text-[11px] text-gray-400">v0.6.0</span>
          </div>

          {/* View Area */}
          <div className="flex-1 overflow-y-auto p-3 pt-16 pb-20">{children}</div>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 w-full max-w-[430px] left-1/2 -translate-x-1/2 z-50">
            <Navigation />
          </div>
        </div>

        {/* Global UI Components */}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
