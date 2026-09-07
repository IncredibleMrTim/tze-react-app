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
 * Launches one browser and hands the caller a `renderPdf` function scoped
 * to it, so any number of independent PDF renders (a batch download, a
 * batch of emails) only pay the (slow) browser launch cost once — instead
 * of each render launching and closing its own browser. Page.pdf() emulates
 * the "print" CSS media type by default, so the FPN template's existing
 * `@media print` rules (hiding the on-screen print button, etc.) apply
 * automatically without any extra handling here.
 */
export async function withPdfBrowser<T>(
  fn: (renderPdf: (html: string) => Promise<Buffer>) => Promise<T>,
): Promise<T> {
  const browser = await launchBrowser()
  try {
    const renderPdf = async (html: string): Promise<Buffer> => {
      const page = await browser.newPage()
      try {
        await page.setContent(html, { waitUntil: "load" })
        const pdf = await page.pdf({ format: "a4", printBackground: true })
        return Buffer.from(pdf)
      } finally {
        await page.close()
      }
    }
    return await fn(renderPdf)
  } finally {
    await browser.close()
  }
}

export async function htmlToPdfBatch(htmls: string[]): Promise<Buffer[]> {
  return withPdfBrowser(async (renderPdf) => {
    const pdfs: Buffer[] = []
    for (const html of htmls) {
      pdfs.push(await renderPdf(html))
    }
    return pdfs
  })
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  const [pdf] = await htmlToPdfBatch([html])
  return pdf
}
