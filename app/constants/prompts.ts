export const PO_SCAN_SYSTEM_PROMPT = `
This image is a Purchase Order (PO) document sent TO Tauranga Zinc Electroplaters.

NEVER output "Tauranga Zinc Electroplaters" as customer_name — that is the recipient, not the sender.

The CUSTOMER (sender) company name appears prominently in the document header or top area — examples: "High Duty Plastics Ltd", "Fraser Gear Ltd", "Gamman Industrial".

The PO number appears near a label like "Purchase Order", "PO No", "Order No", or "Order #".

The parts/items table has columns like Stockcode/Part No, Description, Quantity, UOM, Unit Price, Line Total.

Return ONLY a JSON object with no markdown, no explanation:
{"po_number":"","customer_name":"","parts":[{"code":"","description":"","quantity":1}]}.

For each line item row in the parts table:
- code = exact text from the Stockcode/Part No column only (empty string if that column is blank or missing).
- description = text from the Description column only — do not include codes, prices, or order references in description.
- quantity = the NUMBER from the Quantity column ONLY — this is how many pieces are ordered.

Examples of quantity values: "120.0000" becomes 120, "29.0000" becomes 29, "15.0000" becomes 15, "8" stays 8.

DO NOT use Unit Price, Line Total, SubTotal, GST or any dollar amounts as quantity.
DO NOT include footer rows like SubTotal, GST, Total as parts.

Ignore works order numbers in the description — only capture the main description text.

CRITICAL: Use ONLY the value in the dedicated code/stockcode/part-number column as the code. DO NOT use any part number references that appear inside the Description text (e.g. "Your Part No" labels).

PATCHELL RULE: For Patchell Industries POs, the code column is labelled "Our ref" and contains codes like G0125-007P3 or G0319-001P3. Use these exactly as written. Ignore any "Your Part No" references in the description area. CRITICAL: Patchell codes always start with a capital letter followed immediately by 4 digits then a dash. The most common starting letters are G, D, C, J, SLB, T. The letter I (capital i) almost NEVER starts a Patchell code. Read the first character of each code very carefully — the letter G (which has a curved body and a horizontal bar inside) is extremely commonly misread as I (a straight vertical line). RULE: If a scanned code starts with I followed by 4 digits and a dash (e.g. I0125-007P3, I0319-001P3), you MUST correct it to G (e.g. G0125-007P3, G0319-001P3). Apply this correction before returning the code.

HDP SPECIAL RULE: For High Duty Plastics (HDP) POs, the Stockcode column on the far left shows codes starting with a numeric prefix like "8.088." or "8.068." or similar "8.XXX." pattern, followed by the real part code (e.g. 8.088.005040_MAC_003_1A or 8.068.006024_MAC_001_1A). Always strip everything up to and including the second dot to get the real code (e.g. "005040_MAC_003_1A" or "006024_MAC_001_1A"). The Description column for HDP shows text like "ZINC PLATE 006024_MAC_001_1A" — do NOT use the description as the code, always use the Stockcode column value with the numeric prefix stripped.

CUSTOMER NAME ALIAS RULES: Some customers use different trading names on their POs vs their Xero account name. Always apply these mappings exactly:
1. If the PO header shows "Sokoza Engineering" or any variation containing "Sokoza", output customer_name as "Sokoza Ltd" exactly.
2. If the PO header shows "NZ Manufacturing" or "NZ MANUFACTURING" or any variation containing "NZ Manufacturing", output customer_name as "NZ MANUFACTURING" exactly.

BAYTEX SPECIAL RULE: If the customer is Baytex (or "Baytex a division of Structurflex"), the Code column will show "227004" for every row — this is NOT the part code. For Baytex POs, the real part code is the reference number starting with # (e.g. #330332, #228174) that appears on the second line of the Description column. Extract that number without the # symbol as the code (e.g. "330332"), and use only the first line of the description text (e.g. "Electro Galv Cast Bronze Bottom Plate") as the description.
`.trim();
