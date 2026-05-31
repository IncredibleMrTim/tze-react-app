import type { IContact, IPart, IItem } from "@/types/interfaces";
import { ITEMS } from "@/lib/helpers";

export interface ScannedPart {
  code: string;
  description: string;
  quantity: number;
}

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
function findExactMatch(code: string): ReturnType<typeof ITEMS.find> {
  return ITEMS.find(x => x.code === code);
}

/**
 * Attempts to find a match without the ticker suffix
 */
function findWithoutTicker(code: string): ReturnType<typeof ITEMS.find> {
  const match = code.match(/^(.+?)_[A-Z0-9]{2,6}$/);
  if (match) {
    const base = match[1];
    return ITEMS.find(x => x.code.startsWith(base + '_'));
  }
  return undefined;
}

/**
 * Attempts to find a match by adding common tickers
 */
function findWithTicker(code: string, customer: IContact): ReturnType<typeof ITEMS.find> {
  if (code.includes('_')) return undefined;

  const tickers = ['AGP', 'ASE', 'PATI', customer.account];
  for (const ticker of tickers) {
    const item = ITEMS.find(x => x.code === `${code}_${ticker}`);
    if (item) return item;
  }
  return undefined;
}

/**
 * Attempts to find a match using substring matching (sliding window)
 */
function findBySubstring(code: string, customer: IContact): ReturnType<typeof ITEMS.find> {
  if (customer.account === 'PATI' || code.length < 4) return undefined;

  let bestMatch: IItem | undefined = undefined;
  let bestLength = 0;

  for (const item of ITEMS) {
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
 * Attempts to find a match by description keywords
 */
function findByDescription(description: string, customer: IContact): ReturnType<typeof ITEMS.find> {
  if (description.length <= 3) return undefined;

  const words = description
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3);

  for (const item of ITEMS) {
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
 */
export function matchScannedParts(
  scannedParts: ScannedPart[],
  customer: IContact | null
): IPart[] {
  if (!scannedParts || !customer) return [];

  return scannedParts.map(scanned => {
    const code = normalizeCode(scanned.code);
    const description = scanned.description.trim();
    const quantity = scanned.quantity || 1;

    // Try matching strategies in order of specificity
    const item =
      findExactMatch(code) ||
      findWithoutTicker(code) ||
      findWithTicker(code, customer) ||
      findBySubstring(code, customer) ||
      findByDescription(description, customer) ||
      ITEMS.find(x => x.code === 'ZINC MISCELLANEOUS');

    return {
      code: item?.code || code,
      desc: item?.desc || description,
      price: item?.price || 0,
      qty: quantity,
    };
  });
}
