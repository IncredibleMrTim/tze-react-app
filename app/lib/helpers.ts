import type { IJob, IJigAssignment, IContact, IItem, ISettings } from "@/types/interfaces";
import { calculateRates, calculateMinCharges } from "@/constants/settings.const";
import contactsData from "@/data/contacts.json";
import itemsData from "@/data/items.json";

export const CONTACTS: IContact[] = contactsData as IContact[];
export const ITEMS: IItem[] = itemsData as IItem[];

// ================ TZE ID Generator ================ //

let nextTZECounter = 1;

export const setNextTZE = (val: number) => {
  nextTZECounter = val;
};

export const getNextTZE = () => nextTZECounter;

export const tzeId = (): string => {
  return 'TZE-' + String(nextTZECounter++).padStart(4, '0');
};

// ================ Formatting Helpers ================ //

export const dispCode = (code: string): string => {
  if (!code) return code;
  const m = code.match(/^(.+?)_[A-Z0-9]{2,6}$/);
  return (m && m[1]) || code;
};

export const fmt = (ts: number): string => {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' }) + ' ' +
         d.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' });
};

export const fmtDate = (ts: number): string => {
  return ts ? new Date(ts).toISOString().slice(0, 10) : '';
};

export const fmtArrived = (ts: number): string => {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' +
         d.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' });
};

export const csvQ = (s: any): string => {
  return '"' + String(s).replace(/"/g, '""') + '"';
};

export const due20th = (ts?: number): string => {
  const d = new Date(ts || Date.now());
  let y = d.getFullYear();
  let m = d.getMonth() + 1;
  if (m > 11) {
    m = 0;
    y++;
  }
  return new Date(y, m, 20).toISOString().slice(0, 10);
};

// ================ JIG Helpers ================ //

export const jigsOf = (jid: string, jigA: IJigAssignment[]): IJigAssignment[] => {
  return jigA.filter(g => g.jobId === jid);
};

export const jigUsed = (nm: string, jigA: IJigAssignment[]): number => {
  return jigA.filter(g => g.jigName === nm && !g.completedAt).reduce((s, g) => s + g.pct, 0);
};

export const allDone = (jid: string, jigA: IJigAssignment[]): boolean => {
  const gs = jigsOf(jid, jigA);
  return gs.length > 0 && gs.every(g => g.completedAt);
};

// ================ Job Status Helpers ================ //

export const jobAgeDays = (j: IJob): number => {
  return (Date.now() - j.createdAt) / (1000 * 60 * 60 * 24);
};

export const trafficLight = (j: IJob) => {
  const d = jobAgeDays(j);
  if (d < 3) return { color: '#16a34a', bg: '#f0fdf4', border: '#16a34a', label: 'On time' };
  if (d < 5) return { color: '#d97706', bg: '#fffbeb', border: '#d97706', label: 'Due soon' };
  return { color: '#dc2626', bg: '#fff5f5', border: '#dc2626', label: 'Overdue' };
};

export const isReady = (j: IJob, jigA: IJigAssignment[]): boolean => {
  if (j.dispatchedAt || !j.poComplete) return false;
  const gs = jigA.filter(g => g.jobId === j.id);
  if (!gs.length) return true;
  return gs.every(g => !!g.completedAt);
};

export const stageLabel = (j: IJob, jigA: IJigAssignment[]): string => {
  if (j.dispatchedAt) return 'Dispatched';
  if (isReady(j, jigA)) return 'Ready to dispatch';
  if (jigsOf(j.id, jigA).length) return 'WIP';
  return 'Intake';
};

export const stageBadge = (j: IJob, jigA: IJigAssignment[]): string => {
  if (j.dispatchedAt) return 'b-done';
  if (isReady(j, jigA)) return 'b-dispatch';
  if (jigsOf(j.id, jigA).length) return 'b-jig';
  return 'b-intake';
};

// ================ Customer Resolution ================ //

export const resolveCustomer = (n: string): IContact | null => {
  if (!n) return null;
  const t = n.trim();
  const lc = t.toLowerCase();

  // Helper: normalize company name by removing legal suffixes and extra words
  const normalize = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\b(limited|ltd|incorporated|inc|company|co|engineering|industries|industrial|componentry|pty|proprietary)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Aliases
  if (lc.includes('sokoza')) return CONTACTS.find(c => c.account === 'SOKO') || null;
  if (lc.includes('nz manufacturing')) return CONTACTS.find(c => c.account === 'NZMFG') || null;
  if (lc.includes('baytex')) return CONTACTS.find(c => c.account === 'BAYT') || null;

  // Exact match
  let c = CONTACTS.find(x => x.name.toLowerCase() === lc);
  if (c) return c;

  // Normalized match (strip legal suffixes)
  const normalizedInput = normalize(lc);
  c = CONTACTS.find(x => normalize(x.name) === normalizedInput);
  if (c) return c;

  // Fuzzy match with normalization
  c = CONTACTS.find(x => {
    const normalizedContact = normalize(x.name);
    return normalizedContact.includes(normalizedInput) || normalizedInput.includes(normalizedContact);
  });
  if (c) return c;

  // Original fuzzy match (fallback)
  c = CONTACTS.find(x => x.name.toLowerCase().includes(lc) || lc.includes(x.name.toLowerCase()));
  if (c) return c;

  // Account code match
  c = CONTACTS.find(x => x.account.toLowerCase() === lc);
  return c || null;
};

// ================ Price Calculation ================ //

export const calcPrice = (j: IJob, settings: ISettings): number => {
  if (j.priceOverride != null) return j.priceOverride;

  const rates = calculateRates(settings);
  const minCharges = calculateMinCharges(settings);
  const rate = rates[j.plating] || rates.silver;
  const minC = minCharges[j.plating] || 60;

  let sum = 0;
  j.parts.forEach(p => {
    sum += (p.price || 0) * (p.qty || 1);
  });

  if (j.requiresWeighing && j.weightKg) {
    sum += j.weightKg * rate.kg;
  }

  if (j.stringsRequired && j.stringCount) {
    sum += j.stringCount * (settings.stringRate || 25);
  }

  if (j.freightRequested && j.freightCost) {
    sum += j.freightCost;
  }

  if (j.minCharge && sum < minC) {
    sum = minC;
  }

  return Math.round(sum * 100) / 100;
};

// ================ Image Processing ================ //

export const fixOrientation = (dataUrl: string, cb: (processed: string, rotated: boolean) => void) => {
  const img = new Image();
  img.onload = () => {
    const w = img.width;
    const h = img.height;
    const isLandscape = w > h;

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d')!;

    if (isLandscape) {
      canvas.width = h;
      canvas.height = w;
      ctx.translate(h / 2, w / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -w / 2, -h / 2);
    } else {
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0);
    }

    // Cap dimension
    const maxDim = 2400;
    if (canvas.width > maxDim || canvas.height > maxDim) {
      const scale = maxDim / Math.max(canvas.width, canvas.height);
      const newW = Math.floor(canvas.width * scale);
      const newH = Math.floor(canvas.height * scale);
      const canvas2 = document.createElement('canvas');
      canvas2.width = newW;
      canvas2.height = newH;
      const ctx2 = canvas2.getContext('2d')!;
      ctx2.drawImage(canvas, 0, 0, newW, newH);
      canvas = canvas2;
    }

    // Compress
    let quality = 0.82;
    let result = canvas.toDataURL('image/jpeg', quality);
    const maxSize = 5.4 * 1024 * 1024;

    while (result.length > maxSize && quality > 0.4) {
      quality -= 0.05;
      result = canvas.toDataURL('image/jpeg', quality);
    }

    cb(result, isLandscape);
  };
  img.src = dataUrl;
};
