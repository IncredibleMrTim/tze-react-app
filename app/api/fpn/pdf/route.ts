import { NextRequest, NextResponse } from "next/server"
import { zipSync } from "fflate"
import { getJobById } from "@/lib/db"
import { buildFpnHtml } from "@/lib/exports"
import { htmlToPdfBatch } from "@/lib/pdf"
import type { IJob } from "@/types/interfaces"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const jobIds: string[] = Array.isArray(body.jobIds) ? body.jobIds : []

    if (jobIds.length === 0) {
      return NextResponse.json({ error: "jobIds is required" }, { status: 400 })
    }

    const fetched = await Promise.all(jobIds.map((id) => getJobById(id)))
    const jobs = fetched.filter((j): j is IJob => j !== null)

    if (jobs.length === 0) {
      return NextResponse.json({ error: "No valid jobs found" }, { status: 404 })
    }

    const pdfs = await htmlToPdfBatch(jobs.map((j) => buildFpnHtml(j)))

    if (jobs.length === 1) {
      return new NextResponse(new Uint8Array(pdfs[0]), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="FPN_${jobs[0].po_number}.pdf"`,
        },
      })
    }

    const files: Record<string, Uint8Array> = {}
    jobs.forEach((job, i) => {
      files[`FPN_${job.po_number}.pdf`] = new Uint8Array(pdfs[i])
    })
    const date = new Date().toISOString().slice(0, 10)

    return new NextResponse(new Uint8Array(zipSync(files)), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="FPN-batch-${date}.zip"`,
      },
    })
  } catch (error: unknown) {
    console.error("Failed to generate FPN PDF:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to generate PDF", details: message },
      { status: 500 },
    )
  }
}
