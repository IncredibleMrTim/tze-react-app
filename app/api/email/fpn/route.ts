import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import type { IJob } from "@/types/interfaces";
import { calcPrice } from "@/lib/helpers";
import { LOGO } from "@/lib/logo";

// SMTP Configuration from environment variables
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || "smtp-relay.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
};

// Generate FPN HTML content (matching original design exactly)
function generateFPNHTML(job: IJob): string {
  const ch = "#3D3D3D";
  const go = "#C9A84C";
  const pr = calcPrice(job, {} as any, []); // Using empty settings object as fallback
  const dt = new Date(job.dispatchedAt || Date.now()).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let ph = "";
  if (job.parts && job.parts.length) {
    ph =
      '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:6px"><tr style="background:#f5f5f5"><td style="padding:6px 8px;border:1px solid #ddd;font-weight:600">Code</td><td style="padding:6px 8px;border:1px solid #ddd;font-weight:600">Description</td><td style="padding:6px 8px;border:1px solid #ddd;font-weight:600;text-align:center">Qty</td></tr>';
    job.parts.forEach((p) => {
      ph += `<tr><td style="padding:6px 8px;border:1px solid #ddd;font-family:monospace;font-size:12px">${p.code}</td><td style="padding:6px 8px;border:1px solid #ddd">${p.desc}</td><td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${p.qty}</td></tr>`;
    });
    ph += "</table>";
  }

  const html =
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>FPN ${job.po_number}</title>` +
    "<style>body{font-family:Arial,sans-serif;margin:0;padding:0;color:#222}@media print{.np{display:none!important}*{orphans:3;widows:3}.no-break{page-break-inside:avoid;break-inside:avoid;page-break-before:auto;page-break-after:auto}.no-break *{page-break-inside:avoid;break-inside:avoid}img,table,div[style*='border']{page-break-inside:avoid;break-inside:avoid;page-break-before:auto;page-break-after:auto}div[style*='background:#f']{page-break-inside:avoid;break-inside:avoid}div[style*='background:#F']{page-break-inside:avoid;break-inside:avoid}div[style*='padding:14px'],div[style*='padding:20px']{page-break-inside:avoid;break-inside:avoid}}</style></head><body>" +
    `<div class="np" style="background:#1D9E75;color:#fff;padding:12px 20px;display:flex;justify-content:space-between;align-items:center">` +
    `<span style="font-weight:600">Finished Product Notification — ${job.po_number || "No PO"}</span>` +
    '<button onclick="window.print()" style="background:#fff;color:#1D9E75;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer">Print / Save PDF</button></div>' +
    '<div style="max-width:680px;margin:0 auto;padding:32px 24px">' +
    `<div class="no-break" style="text-align:center;padding-bottom:20px;border-bottom:3px solid ${go}">` +
    `<img src="${LOGO}" style="height:64px;max-width:220px;object-fit:contain;margin:0 auto 12px;display:block">` +
    `<div style="font-size:22px;font-weight:700;color:${ch}">Tauranga Electroplaters</div>` +
    '<div style="font-size:13px;color:#666;margin-top:6px">9/61 Maleme Street, Greerton, Tauranga</div>' +
    '<div style="font-size:13px;color:#666;margin-top:3px">Phone: 07 578 3176 &nbsp;|&nbsp; Sales@tgaelectroplaters.co.nz &nbsp;|&nbsp; www.tgaelectroplaters.co.nz</div></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin:24px 0 20px">' +
    `<div><div style="font-size:20px;font-weight:700;color:${ch}">Finished Product Notification</div><div style="font-size:13px;color:#888;margin-top:4px">${dt}</div></div>` +
    '<div style="text-align:right;background:#f5f5f5;padding:10px 14px;border-radius:8px">' +
    '<div style="font-size:11px;font-weight:600;text-transform:uppercase;color:#888">PO Number</div>' +
    `<div style="font-size:18px;font-weight:700">${job.po_number}</div>` +
    `<div style="font-size:11px;color:#888;margin-top:4px">Invoice: ${job.invoiceNumber}</div></div></div>` +
    '<div class="no-break" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;margin-bottom:20px">' +
    `<div style="background:${ch};color:#fff;padding:8px 14px;font-size:12px;font-weight:600;text-transform:uppercase">Customer</div>` +
    `<div style="padding:14px"><div style="font-size:16px;font-weight:600">${job.customer_name}</div>` +
    (job.customer_contact
      ? `<div style="font-size:14px;color:#555;margin-top:4px">📞 ${job.customer_contact}</div>`
      : "") +
    '<div style="margin-top:10px;font-size:13px;display:flex;gap:20px;flex-wrap:wrap">' +
    `<span>Plating: <strong>${job.plating === "silver" ? "Silver (Zinc Bright)" : "Gold (Zinc Yellow)"}</strong></span>` +
    (job.freightCost
      ? `<span>Freight: <strong>$${parseFloat(job.freightCost.toString()).toFixed(2)}</strong></span>`
      : "") +
    `<span>Total: <strong>$${pr.toFixed(2)}</strong></span></div></div></div>` +
    (ph
      ? `<div class="no-break" style="margin-bottom:20px"><div style="font-size:12px;font-weight:600;text-transform:uppercase;color:#888;margin-bottom:8px">Parts</div>${ph}</div>`
      : "") +
    (job.poPages && job.poPages.length > 0
      ? `<div class="no-break" style="margin:20px 0"><div style="font-size:11px;font-weight:600;text-transform:uppercase;color:#888;margin-bottom:8px">Original PO Document${job.poPages.length > 1 ? ` (${job.poPages.length} pages)` : ''}</div>${job.poPages.map((page: string) => `<img src="${page}" style="max-width:100%;border:1px solid #ddd;border-radius:6px;max-height:280px;object-fit:contain;margin-bottom:10px">`).join('')}</div>`
      : "") +
    (job.partsOnArrivalPhotos && job.partsOnArrivalPhotos.length > 0
      ? `<div class="no-break" style="margin:20px 0"><div style="font-size:11px;font-weight:600;text-transform:uppercase;color:#888;margin-bottom:8px">Parts on Arrival${job.partsOnArrivalPhotos.length > 1 ? ` (${job.partsOnArrivalPhotos.length} photos)` : ''}</div>${job.partsOnArrivalPhotos.map((photo: string) => `<img src="${photo}" style="max-width:100%;border:1px solid #ddd;border-radius:6px;max-height:280px;object-fit:contain;margin-bottom:10px">`).join('')}</div>`
      : "") +
    (job.notes
      ? `<div class="no-break" style="margin-top:20px;padding:14px;background:#FFF9C4;border-left:4px solid ${go};border-radius:4px"><div style="font-size:11px;font-weight:600;text-transform:uppercase;color:#888;margin-bottom:6px">Collection Instructions</div><div style="font-size:14px">${job.notes}</div></div>`
      : "") +
    '<div class="no-break" style="margin-top:28px;padding:20px;background:#f0fdf8;border:2px solid #1D9E75;border-radius:10px;text-align:center">' +
    '<div style="font-size:18px;font-weight:700;color:#065F46;margin-bottom:8px">✓ Your parts are ready for collection</div>' +
    '<div style="font-size:14px;color:#555;margin-bottom:12px">Please collect during opening hours or contact us to arrange pickup.</div>' +
    '<div style="font-size:13px;color:#444;line-height:1.8;text-align:left;display:inline-block">' +
    '<table style="font-size:13px;line-height:1.9;border-collapse:collapse">' +
    '<tr><td style="padding-right:20px;font-weight:600">Mon – Thurs</td><td>8:00am – 4:30pm</td></tr>' +
    '<tr><td style="padding-right:20px;font-weight:600">Friday</td><td>8:00am – 12:00pm</td></tr>' +
    '<tr><td style="padding-right:20px;font-weight:600">Sat, Sun & Public Holidays</td><td>Closed</td></tr>' +
    "</table></div>" +
    '<div style="font-size:13px;color:#888;margin-top:8px">07 578 3176 &nbsp;|&nbsp; Sales@tgaelectroplaters.co.nz</div></div>' +
    '<div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;text-align:center;font-size:11px;color:#aaa">Tauranga Electroplaters · 9/61 Maleme Street, Greerton · www.tgaelectroplaters.co.nz</div>' +
    "</div></body></html>";

  return html;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job } = body as { job: IJob };

    if (!job) {
      return NextResponse.json({ error: "Job data is required" }, { status: 400 });
    }

    if (!job.customer_email) {
      return NextResponse.json({ error: "Customer email not found" }, { status: 400 });
    }

    // Create transporter
    const transporter = nodemailer.createTransport(SMTP_CONFIG);

    // Generate FPN HTML
    const fpnHTML = generateFPNHTML(job);

    // Send email
    const info = await transporter.sendMail({
      from: '"TGA Electroplaters" <sales@tgaelectroplaters.co.nz>',
      to: job.customer_email,
      subject: `Parts Ready for Collection - PO ${job.po_number}`,
      html: fpnHTML,
    });

    console.log("Email sent:", info.messageId);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      recipient: job.customer_email,
    });
  } catch (error: unknown) {
    console.error("Failed to send email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to send email", details: errorMessage },
      { status: 500 }
    );
  }
}
