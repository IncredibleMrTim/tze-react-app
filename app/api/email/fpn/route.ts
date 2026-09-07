import { NextRequest, NextResponse } from "next/server"
import { getJobById, updateJob } from "@/lib/db"
import { buildFpnHtml } from "@/lib/exports"
import { htmlToPdf } from "@/lib/pdf"
import { sendEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

interface ISendResult {
  jobId: string
  po_number: string
  status: "sent" | "skipped" | "failed"
  reason?: string
}

const emailBody = (customerName: string, poNumber: string): string =>
  `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">` +
  `<p>Hi ${customerName},</p>` +
  `<p>Your parts for PO <strong>${poNumber}</strong> are ready for collection. The Finished Product Notification is attached as a PDF.</p>` +
  `<p style="color:#888;font-size:12px;margin-top:24px">Tauranga Electroplaters &middot; 9/61 Maleme Street, Greerton, Tauranga &middot; 07 578 3176</p>` +
  `</div>`

async function sendFpnEmail(jobId: string): Promise<ISendResult> {
  const job = await getJobById(jobId)
  if (!job) {
    return { jobId, po_number: "", status: "failed", reason: "Job not found" }
  }
  if (!job.customer_email) {
    return {
      jobId,
      po_number: job.po_number,
      status: "skipped",
      reason: "No customer email on file",
    }
  }

  try {
    const pdf = await htmlToPdf(buildFpnHtml(job))
    await sendEmail({
      to: job.customer_email,
      subject: `Parts Ready for Collection - PO ${job.po_number}`,
      html: emailBody(job.customer_name, job.po_number),
      attachments: [
        {
          filename: `FPN_${job.po_number}.pdf`,
          content: pdf,
          contentType: "application/pdf",
        },
      ],
    })
    // Emailing satisfies the same "customer has the FPN" purpose as a
    // download, so it drops off the pending-download list the same way.
    await updateJob(jobId, { fpnEmailedAt: Date.now(), fpnDownloaded: true })
    return { jobId, po_number: job.po_number, status: "sent" }
  } catch (error) {
    console.error(`Failed to email FPN for job ${jobId}:`, error)
    const reason = error instanceof Error ? error.message : "Unknown error"
    return { jobId, po_number: job.po_number, status: "failed", reason }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const jobIds: string[] = Array.isArray(body.jobIds)
      ? body.jobIds
      : body.jobId
        ? [body.jobId]
        : []

    if (jobIds.length === 0) {
      return NextResponse.json({ error: "jobIds is required" }, { status: 400 })
    }

    const results: ISendResult[] = []
    for (const jobId of jobIds) {
      results.push(await sendFpnEmail(jobId))
    }

    return NextResponse.json({ results })
  } catch (error: unknown) {
    console.error("Failed to send FPN email:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to send email", details: message },
      { status: 500 },
    )
  }
}
