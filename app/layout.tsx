import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Navigation } from "./navigation"
import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import { Toaster } from "sonner"
import { QueryProvider } from "./providers/QueryProvider"
import packageJson from "../package.json"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Tauranga Zinc Electroplaters",
  description: "Job management system for TZE",
}

// interactiveWidget: "resizes-content" makes the layout viewport (and any
// position: fixed element, like the intake drawer) shrink with the on-screen
// keyboard instead of staying full-height while the keyboard covers it.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body>
        <QueryProvider>
          <div className="w-full md:max-w-[430px] h-dvh bg-white md:rounded-2xl overflow-hidden md:shadow-lg flex flex-col mx-auto">
            {/* Header */}
            <div className="fixed top-0 w-full md:max-w-[430px] left-1/2 -translate-x-1/2 z-50 bg-white border-b border-gray-200 px-4 py-3.5 flex items-center justify-between">
              <h1 className="text-base font-bold text-primary">
                Tauranga Zinc Electroplaters
              </h1>
              <span className="text-[11px] text-gray-400">
                v{packageJson.version}
              </span>
            </div>

            {/* View Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 pt-16 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
              {children}
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 w-full md:max-w-[430px] left-1/2 -translate-x-1/2 z-50 pb-[env(safe-area-inset-bottom)] bg-white">
              <Navigation />
            </div>
          </div>

          {/* Global UI Components */}
          <Toaster position="top-center" />
        </QueryProvider>
      </body>
    </html>
  )
}
