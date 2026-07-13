import type { IContact, IPart, IItem, IScannedPart } from "@/types/interfaces";

// Re-export for backward compatibility
export type ScannedPart = IScannedPart;

/**
 * Normalizes a part code for matching by removing numeric prefixes and converting dots to underscores
 */
function normalizeCode(code: string): string {
  let normalized = code.trim();

  // Strip numeric prefix for matching (e.g. "8.088." from HDP)
  if (/^\d+\.\d+\./.test(normalized)) {
    const dotIdx = normalized.indexOf('.', normalized.indexOf('.') + 1);
    if (dotIdx > 0) {
      normalized = normalized.slice(dotIdx + 1);
    }
  }

  // Convert dots to underscores
  return normalized.replace(/\./g, '_');
}

/**
 * Attempts to find an exact match for the part code
 */
function findExactMatch(code: string, customer: IContact, items: IItem[]): IItem | undefined {
  return items.find(item => {
    if (item.code !== code) return false;
    // If item has a customer restriction, it must match
    if (item.customer && item.customer !== customer.account) return false;
    return true;
  });
}

/**
 * Attempts to find a match without the ticker suffix
 */
function findWithoutTicker(code: string, customer: IContact, items: IItem[]): IItem | undefined {
  const match = code.match(/^(.+?)_[A-Z0-9]{2,6}$/);
  if (match) {
    const base = match[1];
    return items.find(item => {
      if (!item.code.startsWith(base + '_')) return false;
      // If item has a customer restriction, it must match
      if (item.customer && item.customer !== customer.account) return false;
      return true;
    });
  }
  return undefined;
}

/**
 * Attempts to find a match by adding common tickers
 */
function findWithTicker(code: string, customer: IContact, items: IItem[]): IItem | undefined {
  if (code.includes('_')) return undefined;

  const tickers = ['AGP', 'ASE', 'PATI', customer.account];
  for (const ticker of tickers) {
    const item = items.find(x => {
      if (x.code !== `${code}_${ticker}`) return false;
      // If item has a customer restriction, it must match
      if (x.customer && x.customer !== customer.account) return false;
      return true;
    });
    if (item) return item;
  }
  return undefined;
}

/**
 * Attempts to find a match using substring matching (sliding window)
 */
function findBySubstring(code: string, customer: IContact, items: IItem[]): IItem | undefined {
  if (customer.account === 'PATI' || code.length < 4) return undefined;

  let bestMatch: IItem | undefined = undefined;
  let bestLength = 0;

  for (const item of items) {
    if (item.customer && item.customer !== customer.account) continue;

    const itemCode = item.code.replace(/_[A-Z0-9]{2,6}$/, '');

    for (let i = 0; i <= code.length - 3; i++) {
      for (let j = i + 3; j <= code.length; j++) {
        const substring = code.slice(i, j);
        if (itemCode.includes(substring) && substring.length > bestLength) {
          bestLength = substring.length;
          bestMatch = item;
        }
      }
    }
  }

  return bestLength >= 4 ? bestMatch : undefined;
}

/**
 * Fuzzy match code similarity - ONLY within customer's items
 */
function findByCodeFuzzy(code: string, customer: IContact, items: IItem[]): IItem | undefined {
  if (code.length < 3) return undefined;

  const normalizedCode = code.toLowerCase().replace(/[\s\-_]/g, '');
  let bestMatch: IItem | undefined = undefined;
  let bestScore = 0;

  for (const item of items) {
    // CRITICAL: Only match items for this customer or generic items
    if (item.customer && item.customer !== customer.account) continue;

    const itemCode = item.code.toLowerCase().replace(/[\s\-_]/g, '');

    // Calculate similarity score
    let score = 0;

    // Check if codes are very similar (allow 1-2 char difference)
    const minLen = Math.min(normalizedCode.length, itemCode.length);
    const maxLen = Math.max(normalizedCode.length, itemCode.length);

    if (maxLen - minLen > 2) continue; // Too different in length

    // Count matching characters in order
    for (let i = 0; i < minLen; i++) {
      if (normalizedCode[i] === itemCode[i]) score++;
    }

    // Require at least 90% match
    const similarity = score / maxLen;
    if (similarity >= 0.9 && score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  return bestMatch;
}

/**
 * Attempts to find a match by description keywords
 */
function findByDescription(description: string, customer: IContact, items: IItem[]): IItem | undefined {
  if (description.length <= 3) return undefined;

  const words = description
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3);

  for (const item of items) {
    if (item.customer && item.customer !== customer.account) continue;

    const itemDesc = item.desc.toLowerCase();
    if (words.some(word => itemDesc.includes(word))) {
      return item;
    }
  }

  return undefined;
}

/**
 * Matches scanned parts from a PO to inventory items
 * @param scannedParts - Parts extracted from PO scan
 * @param customer - Resolved customer contact
 * @param items - All inventory items loaded from database
 */
export function matchScannedParts(
  scannedParts: ScannedPart[],
  customer: IContact | null,
  items: IItem[]
): IPart[] {
  if (!scannedParts || !customer) return [];

  return scannedParts.map(scanned => {
    const code = normalizeCode(scanned.code);
    const description = scanned.description.trim();
    const quantity = scanned.quantity || 1;

    // Try matching strategies in order of specificity
    const item =
      findExactMatch(code, customer, items) ||
      findWithoutTicker(code, customer, items) ||
      findWithTicker(code, customer, items) ||
      findBySubstring(code, customer, items) ||
      findByCodeFuzzy(code, customer, items) ||
      findByDescription(description, customer, items);

    // If no match found, use ZINC MISCELLANEOUS but keep the scanned data
    if (!item) {
      const zincMisc = items.find(x => x.code === 'ZINC MISCELLANEOUS');

      // Build description from scanned PO data
      let fallbackDesc = description;
      if (code && description) {
        fallbackDesc = `${code} - ${description}`;
      } else if (code) {
        fallbackDesc = code;
      }

      return {
        code: code || '',
        desc: fallbackDesc,
        price: zincMisc?.price || 0,
        qty: quantity,
      };
    }

    return {
      code: item?.code || code || '',
      desc: item?.desc || description,
      price: item?.price || 0,
      qty: quantity,
    };
  });
}
