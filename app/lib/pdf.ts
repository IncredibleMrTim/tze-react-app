import type { Browser } from "puppeteer-core"

// Vercel's serverless functions can't launch the full `puppeteer` download
// (it bundles a desktop-sized Chromium build) so production renders with
// `puppeteer-core` pointed at the `@sparticuz/chromium` binary built for
// that environment, while local dev uses plain `puppeteer` (which manages
// its own bundled Chromium and needs no extra setup on a dev machine).
const isServerless = !!process.env.VERCEL

async function launchBrowser(): Promise<Browser> {
  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default
    const puppeteer = await import("puppeteer-core")
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    }) as unknown as Promise<Browser>
  }

  const puppeteer = await import("puppeteer")
  return puppeteer.launch({ headless: true }) as unknown as Promise<Browser>
}

/**
 * Renders one or more HTML strings to PDF buffers via headless Chromium,
 * reusing a single browser instance across all pages so a batch of jobs
 * only pays the (slow) browser launch cost once. Page.pdf() emulates the
 * "print" CSS media type by default, so the FPN template's existing
 * `@media print` rules (hiding the on-screen print button, etc.) apply
 * automatically without any extra handling here.
 */
export async function htmlToPdfBatch(htmls: string[]): Promise<Buffer[]> {
  const browser = await launchBrowser()
  try {
    const pdfs: Buffer[] = []
    for (const html of htmls) {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: "load" })
      const pdf = await page.pdf({ format: "a4", printBackground: true })
      pdfs.push(Buffer.from(pdf))
      await page.close()
    }
    return pdfs
  } finally {
    await browser.close()
  }
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  const [pdf] = await htmlToPdfBatch([html])
  return pdf
}
