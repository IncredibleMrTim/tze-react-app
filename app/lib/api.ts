import type { IPart, IContact, IItem, IScannedPart } from "@/types/interfaces";
import { resolveCustomer } from "@/lib/helpers";

export const callClaudeAPI = async (
  b64data: string,
  systemPrompt: string,
  maxTokens: number
): Promise<string> => {
  const userApiKey = localStorage.getItem('tze_api_key');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // If user has configured their own API key, send it via header
  if (userApiKey) {
    headers['x-user-api-key'] = userApiKey;
  }

  const response = await fetch('/api/claude', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      b64data,
      systemPrompt,
      maxTokens,
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `API ${response.status}`);
  }

  const data = await response.json();
  return data.result;
};

export const PO_SCAN_SYSTEM_PROMPT = 'This image is a Purchase Order (PO) document sent TO Tauranga Zinc Electroplaters. '
  + 'NEVER output "Tauranga Zinc Electroplaters" as customer_name — that is the recipient, not the sender. '
  + 'The CUSTOMER (sender) company name appears prominently in the document header or top area — examples: "High Duty Plastics Ltd", "Fraser Gear Ltd", "Gamman Industrial". '
  + 'The PO number appears near a label like "Purchase Order", "PO No", "Order No", or "Order #". '
  + 'The parts/items table has columns like Stockcode/Part No, Description, Quantity, UOM, Unit Price, Line Total. '
  + 'Return ONLY a JSON object with no markdown, no explanation: '
  + '{"po_number":"","customer_name":"","parts":[{"code":"","description":"","quantity":1}]}. '
  + 'For each line item row in the parts table: '
  + 'code = exact text from the Stockcode/Part No column only (empty string if that column is blank or missing). '
  + 'description = text from the Description column only — do not include codes, prices, or order references in description. '
  + 'quantity = the NUMBER from the Quantity column ONLY — this is how many pieces are ordered. '
  + 'Examples of quantity values: "120.0000" becomes 120, "29.0000" becomes 29, "15.0000" becomes 15, "8" stays 8. '
  + 'DO NOT use Unit Price, Line Total, SubTotal, GST or any dollar amounts as quantity. '
  + 'DO NOT include footer rows like SubTotal, GST, Total as parts. '
  + 'Ignore works order numbers in the description — only capture the main description text. '
  + 'CRITICAL: Use ONLY the value in the dedicated code/stockcode/part-number column as the code. DO NOT use any part number references that appear inside the Description text (e.g. "Your Part No" labels). '
  + 'PATCHELL RULE: For Patchell Industries POs, the code column is labelled "Our ref" and contains codes like G0125-007P3 or G0319-001P3. Use these exactly as written. Ignore any "Your Part No" references in the description area. CRITICAL: Patchell codes always start with a capital letter followed immediately by 4 digits then a dash. The most common starting letters are G, D, C, J, SLB, T. The letter I (capital i) almost NEVER starts a Patchell code. Read the first character of each code very carefully — the letter G (which has a curved body and a horizontal bar inside) is extremely commonly misread as I (a straight vertical line). RULE: If a scanned code starts with I followed by 4 digits and a dash (e.g. I0125-007P3, I0319-001P3), you MUST correct it to G (e.g. G0125-007P3, G0319-001P3). Apply this correction before returning the code. '
  + 'HDP SPECIAL RULE: For High Duty Plastics (HDP) POs, the Stockcode column on the far left shows codes starting with a numeric prefix like "8.088." or "8.068." or similar "8.XXX." pattern, followed by the real part code (e.g. 8.088.005040_MAC_003_1A or 8.068.006024_MAC_001_1A). Always strip everything up to and including the second dot to get the real code (e.g. "005040_MAC_003_1A" or "006024_MAC_001_1A"). The Description column for HDP shows text like "ZINC PLATE 006024_MAC_001_1A" — do NOT use the description as the code, always use the Stockcode column value with the numeric prefix stripped. '
  + 'CUSTOMER NAME ALIAS RULES: Some customers use different trading names on their POs vs their Xero account name. Always apply these mappings exactly: (1) If the PO header shows "Sokoza Engineering" or any variation containing "Sokoza", output customer_name as "Sokoza Ltd" exactly. (2) If the PO header shows "NZ Manufacturing" or "NZ MANUFACTURING" or any variation containing "NZ Manufacturing", output customer_name as "NZ MANUFACTURING" exactly. '
  + 'BAYTEX SPECIAL RULE: If the customer is Baytex (or "Baytex a division of Structurflex"), the Code column will show "227004" for every row — this is NOT the part code. '
  + 'For Baytex POs, the real part code is the reference number starting with # (e.g. #330332, #228174) that appears on the second line of the Description column. '
  + 'Extract that number without the # symbol as the code (e.g. "330332"), and use only the first line of the description text (e.g. "Electro Galv Cast Bronze Bottom Plate") as the description.';

export const scanPODocument = async (
  file: File,
  contacts: IContact[],
  items: IItem[]
): Promise<{
  po_number: string;
  customer_name: string;
  customer: IContact | null;
  parts: IPart[];
  raw: string;
  urgent: boolean;
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      fixOrientation(result, async (fixedData) => {
        try {
          const b64 = fixedData.split(',')[1];
          const raw = await callClaudeAPI(b64, PO_SCAN_SYSTEM_PROMPT, 1500);

          interface POScanResult {
            po_number?: string;
            customer_name?: string;
            parts?: IScannedPart[];
          }

          let parsed: POScanResult = {};
          try {
            parsed = JSON.parse(raw) as POScanResult;
          } catch (e) {
            reject(new Error('Could not parse JSON response'));
            return;
          }

          const po_number = parsed.po_number || '';
          const customer_name = parsed.customer_name || '';
          const scannedParts = parsed.parts || [];
          const urgent = raw.toUpperCase().indexOf('URGENT') >= 0;

          // Match customer
          const customer = customer_name ? resolveCustomer(customer_name, contacts) : null;

          // Match parts to inventory
          const parts = matchScannedParts(scannedParts, customer, items);

          resolve({
            po_number,
            customer_name,
            customer,
            parts,
            raw,
            urgent,
          });
        } catch (err) {
          reject(err);
        }
      });
    };
    reader.readAsDataURL(file);
  });
};

const matchScannedParts = (scannedParts: IScannedPart[], customer: IContact | null, ITEMS: IItem[]): IPart[] => {
  if (!scannedParts || !customer || !ITEMS) return [];

  const parts: IPart[] = [];

  scannedParts.forEach((sp) => {
    let code = (sp.code || '').trim();
    const desc = (sp.description || '').trim();
    const qty = sp.quantity || 1;

    // Strip numeric prefix for matching (e.g. "8.088." from HDP)
    if (/^\d+\.\d+\./.test(code)) {
      const dotIdx = code.indexOf('.', code.indexOf('.') + 1);
      if (dotIdx > 0) code = code.slice(dotIdx + 1);
    }

    // Convert dots to underscores
    code = code.replace(/\./g, '_');

    // Try matching
    let item = ITEMS.find((item: IItem) => item.code === code);

    // Try without ticker
    if (!item) {
      const m = code.match(/^(.+?)_[A-Z0-9]{2,6}$/);
      if (m) {
        const base = m[1];
        item = ITEMS.find((item: IItem) => item.code.startsWith(base + '_'));
      }
    }

    // Try with common tickers
    if (!item && !code.includes('_')) {
      const tickers = ['AGP', 'ASE', 'PATI', customer.account];
      for (const t of tickers) {
        item = ITEMS.find((item: IItem) => item.code === code + '_' + t);
        if (item) break;
      }
    }

    // Sliding window substring match (skip PATI)
    if (!item && customer.account !== 'PATI' && code.length >= 4) {
      let best = null;
      let bestLen = 0;
      for (const it of ITEMS) {
        if (it.customer && it.customer !== customer.account) continue;
        const itc = it.code.replace(/_[A-Z0-9]{2,6}$/, '');
        for (let i = 0; i <= code.length - 3; i++) {
          for (let j = i + 3; j <= code.length; j++) {
            const sub = code.slice(i, j);
            if (itc.includes(sub) && sub.length > bestLen) {
              bestLen = sub.length;
              best = it;
            }
          }
        }
      }
      if (best && bestLen >= 4) item = best;
    }

    // Description keyword match
    if (!item && desc.length > 3) {
      const words = desc.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
      for (const it of ITEMS) {
        if (it.customer && it.customer !== customer.account) continue;
        const itDesc = it.desc.toLowerCase();
        if (words.some((w: string) => itDesc.includes(w))) {
          item = it;
          break;
        }
      }
    }

    // Fallback
    if (!item) {
      item = ITEMS.find((item: IItem) => item.code === 'ZINC MISCELLANEOUS');
    }

    parts.push({
      code: item?.code || code,
      desc: item?.desc || desc,
      price: item?.price || 0,
      qty,
    });
  });

  return parts;
};

// Import fixOrientation for image processing
import { fixOrientation } from "@/lib/helpers";
