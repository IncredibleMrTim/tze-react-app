import type { IJob, ISettings, IJigAssignment } from "@/interfaces";
import { calcPrice, csvQ, due20th, fmtDate } from "@/lib/helpers";
import { CSV_HDR } from "@/constants/invoice.const";
import logoData from "@/data/logo.txt?raw";

export const genFPN = (j: IJob): void => {
  const ch = '#3D3D3D';
  const go = '#C9A84C';
  const pr = calcPrice(j, {} as ISettings);
  const dt = new Date(j.dispatchedAt || Date.now()).toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  let ph = '';
  if (j.parts && j.parts.length) {
    ph = '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:6px"><tr style="background:#f5f5f5"><td style="padding:6px 8px;border:1px solid #ddd;font-weight:600">Code</td><td style="padding:6px 8px;border:1px solid #ddd;font-weight:600">Description</td><td style="padding:6px 8px;border:1px solid #ddd;font-weight:600;text-align:center">Qty</td></tr>';
    j.parts.forEach(p => {
      ph += `<tr><td style="padding:6px 8px;border:1px solid #ddd;font-family:monospace;font-size:12px">${p.code}</td><td style="padding:6px 8px;border:1px solid #ddd">${p.desc}</td><td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${p.qty}</td></tr>`;
    });
    ph += '</table>';
  }

  const LOGO = 'data:image/png;base64,' + logoData;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>FPN ${j.po_number}</title>` +
    '<style>body{font-family:Arial,sans-serif;margin:0;padding:0;color:#222}@media print{.np{display:none}}</style></head><body>' +
    `<div class="np" style="background:#1D9E75;color:#fff;padding:12px 20px;display:flex;justify-content:space-between;align-items:center">` +
    `<span style="font-weight:600">Finished Product Notification — ${j.po_number || 'No PO'}</span>` +
    '<button onclick="window.print()" style="background:#fff;color:#1D9E75;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer">Print / Save PDF</button></div>' +
    '<div style="max-width:680px;margin:0 auto;padding:32px 24px">' +
    `<div style="text-align:center;padding-bottom:20px;border-bottom:3px solid ${go}">` +
    `<img src="${LOGO}" style="height:64px;max-width:220px;object-fit:contain;margin:0 auto 12px;display:block">` +
    `<div style="font-size:22px;font-weight:700;color:${ch}">Tauranga Electroplaters</div>` +
    '<div style="font-size:13px;color:#666;margin-top:6px">9/61 Maleme Street, Greerton, Tauranga</div>' +
    '<div style="font-size:13px;color:#666;margin-top:3px">Phone: 07 578 3176 &nbsp;|&nbsp; Sales@tgaelectroplaters.co.nz &nbsp;|&nbsp; www.tgaelectroplaters.co.nz</div></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin:24px 0 20px">' +
    `<div><div style="font-size:20px;font-weight:700;color:${ch}">Finished Product Notification</div><div style="font-size:13px;color:#888;margin-top:4px">${dt}</div></div>` +
    '<div style="text-align:right;background:#f5f5f5;padding:10px 14px;border-radius:8px">' +
    '<div style="font-size:11px;font-weight:600;text-transform:uppercase;color:#888">PO Number</div>' +
    `<div style="font-size:18px;font-weight:700">${j.po_number}</div>` +
    `<div style="font-size:11px;color:#888;margin-top:4px">Invoice: ${j.invoiceNumber}</div></div></div>` +
    '<div style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;margin-bottom:20px">' +
    `<div style="background:${ch};color:#fff;padding:8px 14px;font-size:12px;font-weight:600;text-transform:uppercase">Customer</div>` +
    `<div style="padding:14px"><div style="font-size:16px;font-weight:600">${j.customer_name}</div>` +
    (j.customer_contact ? `<div style="font-size:14px;color:#555;margin-top:4px">📞 ${j.customer_contact}</div>` : '') +
    '<div style="margin-top:10px;font-size:13px;display:flex;gap:20px;flex-wrap:wrap">' +
    `<span>Plating: <strong>${j.plating === 'silver' ? 'Silver (Zinc Bright)' : 'Gold (Zinc Yellow)'}</strong></span>` +
    (j.freightCost ? `<span>Freight: <strong>$${parseFloat(j.freightCost.toString()).toFixed(2)}</strong></span>` : '') +
    `<span>Total: <strong>$${pr.toFixed(2)}</strong></span></div></div></div>` +
    (ph ? `<div style="margin-bottom:20px"><div style="font-size:12px;font-weight:600;text-transform:uppercase;color:#888;margin-bottom:8px">Parts</div>${ph}</div>` : '') +
    (j.poPic ? `<div style="margin:20px 0"><div style="font-size:11px;font-weight:600;text-transform:uppercase;color:#888;margin-bottom:8px">Original PO Document</div><img src="${j.poPic}" style="max-width:100%;border:1px solid #ddd;border-radius:6px;max-height:280px;object-fit:contain"></div>` : '') +
    (j.partsPic ? `<div style="margin:20px 0"><div style="font-size:11px;font-weight:600;text-transform:uppercase;color:#888;margin-bottom:8px">Parts on Arrival</div><img src="${j.partsPic}" style="max-width:100%;border:1px solid #ddd;border-radius:6px;max-height:280px;object-fit:contain"></div>` : '') +
    (j.notes ? `<div style="margin-top:20px;padding:14px;background:#FFF9C4;border-left:4px solid ${go};border-radius:4px"><div style="font-size:11px;font-weight:600;text-transform:uppercase;color:#888;margin-bottom:6px">Collection Instructions</div><div style="font-size:14px">${j.notes}</div></div>` : '') +
    '<div style="margin-top:28px;padding:20px;background:#f0fdf8;border:2px solid #1D9E75;border-radius:10px;text-align:center">' +
    '<div style="font-size:18px;font-weight:700;color:#065F46;margin-bottom:8px">✓ Your parts are ready for collection</div>' +
    '<div style="font-size:14px;color:#555;margin-bottom:12px">Please collect during opening hours or contact us to arrange pickup.</div>' +
    '<div style="font-size:13px;color:#444;line-height:1.8;text-align:left;display:inline-block">' +
    '<table style="font-size:13px;line-height:1.9;border-collapse:collapse">' +
    '<tr><td style="padding-right:20px;font-weight:600">Mon – Thurs</td><td>8:00am – 4:30pm</td></tr>' +
    '<tr><td style="padding-right:20px;font-weight:600">Friday</td><td>8:00am – 12:00pm</td></tr>' +
    '<tr><td style="padding-right:20px;font-weight:600">Sat, Sun & Public Holidays</td><td>Closed</td></tr>' +
    '</table></div>' +
    '<div style="font-size:13px;color:#888;margin-top:8px">07 578 3176 &nbsp;|&nbsp; Sales@tgaelectroplaters.co.nz</div></div>' +
    '<div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;text-align:center;font-size:11px;color:#aaa">Tauranga Electroplaters · 9/61 Maleme Street, Greerton · www.tgaelectroplaters.co.nz</div>' +
    '</div></body></html>';

  dl(new Blob([html], { type: 'text/html' }), `FPN_${j.po_number}.html`);
};

export const genCSV = (j: IJob, settings: ISettings): void => {
  const body = csvRows(j, [], settings).join('\n') + '\n';
  dl(new Blob([CSV_HDR + body], { type: 'text/csv' }), `Invoice_${j.invoiceNumber}.csv`);
};

export const genBatchCSV = (jobs: IJob[], ids: string[], _settings: ISettings, jigA: IJigAssignment[]): void => {
  const selected = jobs.filter(j => ids.indexOf(j.id) >= 0 && j.dispatchedAt && !j.isInternal && !j.isRework);
  if (!selected.length) {
    alert('No valid jobs selected');
    return;
  }

  const allRows: string[] = [];
  selected.forEach(j => {
    csvRows(j, jigA, _settings).forEach(r => allRows.push(r));
  });

  const body = allRows.join('\n') + '\n';
  const date = new Date().toISOString().slice(0, 10);
  dl(new Blob([CSV_HDR + body], { type: 'text/csv' }), `TZE_Batch_${date}.csv`);
};

const csvRows = (j: IJob, _jigA: IJigAssignment[], _settings: ISettings): string[] => {
  const dd = fmtDate(j.dispatchedAt || Date.now());
  const due = due20th(j.dispatchedAt || Date.now());
  const rows: string[] = [];
  const isGold = j.plating === 'gold';

  if (j.priceOverride != null) {
    const ic = isGold ? 'ZINC GOLD STANDARD' : 'ZINC SILVER STANDARD';
    const row = [
      csvQ(j.customer_name), csvQ(j.customer_email), '', '', '', '', '', '', '', '',
      csvQ(j.invoiceNumber), csvQ(j.po_number), csvQ(dd), csvQ(due),
      csvQ(ic), csvQ('Zinc Electroplating - Price override'), '1', csvQ(j.priceOverride), '', '200', 'GST on Income', '', '', '', '', 'NZD', ''
    ].join(',');
    rows.push(row);
  } else {
    j.parts.forEach(p => {
      const row = [
        csvQ(j.customer_name), csvQ(j.customer_email), '', '', '', '', '', '', '', '',
        csvQ(j.invoiceNumber), csvQ(j.po_number), csvQ(dd), csvQ(due),
        csvQ(p.code), csvQ(p.desc), String(p.qty), csvQ(p.price), '', '200', 'GST on Income', '', '', '', '', 'NZD', ''
      ].join(',');
      rows.push(row);
    });
  }

  if (j.freightCost) {
    const row = [
      csvQ(j.customer_name), csvQ(j.customer_email), '', '', '', '', '', '', '', '',
      csvQ(j.invoiceNumber), csvQ(j.po_number), csvQ(dd), csvQ(due),
      'FREIGHT', csvQ('Freight'), '1', csvQ(j.freightCost), '', '200', 'GST on Income', '', '', '', '', 'NZD', ''
    ].join(',');
    rows.push(row);
  }

  return rows;
};

export const dl = (blob: Blob, name: string): void => {
  const u = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = u;
  a.download = name;
  a.click();
  URL.revokeObjectURL(u);
};
