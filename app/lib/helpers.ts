import type {
  IJob,
  IJigAssignment,
  IContact,
  IItem,
  ISettings,
} from "@/types/interfaces";
import {
  calculateRates,
  calculateMinCharges,
} from "@/constants/settings.const";

// Helper function to get contacts from store
// Note: These will be loaded from the database on app startup
export const CONTACTS: IContact[] = [];
export const ITEMS: IItem[] = [];

// ================ TZE ID Generator ================ //

let nextTZECounter = 1;

export const setNextTZE = (val: number) => {
  nextTZECounter = val;
};

export const getNextTZE = () => nextTZECounter;

export const tzeId = (): string => {
  return "TZE-" + String(nextTZECounter++).padStart(4, "0");
};

// ================ Formatting Helpers ================ //

export const dispCode = (code: string): string => {
  if (!code) return code;
  const m = code.match(/^(.+?)_[A-Z0-9]{2,6}$/);
  return (m && m[1]) || code;
};

export const fmt = (ts: number): string => {
  if (!ts) return "";
  const d = new Date(ts);
  return (
    d.toLocaleDateString("en-NZ", { day: "numeric", month: "short" }) +
    " " +
    d.toLocaleTimeString("en-NZ", { hour: "2-digit", minute: "2-digit" })
  );
};

export const fmtDate = (ts: number): string => {
  return ts ? new Date(ts).toISOString().slice(0, 10) : "";
};

export const fmtArrived = (ts: number): string => {
  if (!ts) return "";
  const d = new Date(ts);
  return (
    d.toLocaleDateString("en-NZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString("en-NZ", { hour: "2-digit", minute: "2-digit" })
  );
};

export const csvQ = (s: unknown): string => {
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

export const jigsOf = (
  jid: string,
  jigAssignments: IJigAssignment[],
): IJigAssignment[] => {
  return jigAssignments.filter((g) => g.jobId === jid);
};

export const jigUsed = (
  nm: string,
  jigAssignments: IJigAssignment[],
): number => {
  return jigAssignments
    .filter((g) => g.jigName === nm && g.status === "ACTIVE")
    .reduce((s, g) => s + g.pct, 0);
};

export const allDone = (
  jid: string,
  jigAssignments: IJigAssignment[],
): boolean => {
  const gs = jigsOf(jid, jigAssignments);
  return gs.length > 0 && gs.every((g) => g.status === "CLEARED");
};

// Check if a job is currently on any jig
export const isOnJig = (
  jid: string,
  jigAssignments: IJigAssignment[],
): boolean => {
  return jigAssignments.some((g) => g.jobId === jid && g.status === "ACTIVE");
};

// Get the active jig name(s) for a job
export const getJobJigNames = (
  jid: string,
  jigAssignments: IJigAssignment[],
): string[] => {
  return jigAssignments
    .filter((g) => g.jobId === jid && g.status === "ACTIVE")
    .map((g) => g.jigName);
};

// Get the first active jig name for a job (for single jig scenarios)
export const getJobJigName = (
  jid: string,
  jigAssignments: IJigAssignment[],
): string | null => {
  const jig = jigAssignments.find(
    (g) => g.jobId === jid && g.status === "ACTIVE",
  );

  return jig?.jigName
    ? `${jig.jigName}: ${jig.pct}% - (Loaded: ${new Date(jig.loadedAt).toLocaleDateString()})`
    : null;
};

// Get all active jig assignments for a job
export const getActiveJigs = (
  jid: string,
  jigAssignments: IJigAssignment[],
): IJigAssignment[] => {
  return jigAssignments.filter((g) => g.jobId === jid && g.status === "ACTIVE");
};

// ================ Job Status Helpers ================ //

export const jobAgeDays = (j: IJob): number => {
  return (Date.now() - j.createdAt) / (1000 * 60 * 60 * 24);
};

export const jobAgeTrafficLight = (j: IJob) => {
  const d = jobAgeDays(j);
  if (d < 2)
    return {
      color: "#16a34a",
      bg: "#f0fdf4",
      border: "#16a34a",
      label: "On time",
    };
  if (d < 5)
    return {
      color: "#d97706",
      bg: "#fffbeb",
      border: "#d97706",
      label: "Due soon",
    };
  return {
    color: "#dc2626",
    bg: "#fff5f5",
    border: "#dc2626",
    label: "Overdue",
  };
};

export const jobStatusTrafficLight = (
  j: IJob,
  jigAssignments: IJigAssignment[],
) => {
  const status = stageLabel(j, jigAssignments);
  switch (status) {
    case "Dispatched":
      return {
        color: "#6b7280",
        bg: "#f9fafb",
        border: "#6b7280",
        label: "Dispatched",
      };
    case "Ready to dispatch":
      return {
        color: "#2563eb",
        bg: "#eff6ff",
        border: "#2563eb",
        label: "Ready",
      };
    case "WIP":
      return {
        color: "#d97706",
        bg: "#fffbeb",
        border: "#d97706",
        label: "WIP",
      };

    case "Intake":
    default:
      return {
        color: "#16a34a",
        bg: "#f0fdf4",
        border: "#16a34a",
        label: "Intake",
      };
  }
};

export const isReady = (j: IJob, jigAssignments: IJigAssignment[]): boolean => {
  if (j.dispatchedAt || !j.poComplete) return false;
  const gs = jigAssignments.filter((g) => g.jobId === j.id);
  // Job must have at least one jig assignment to be ready for dispatch
  if (!gs.length) return false;
  return gs.every((g) => g.status === "CLEARED");
};

export const isDispatched = (j: IJob) => !!j.dispatchedAt;

export const stageLabel = (
  j: IJob,
  jigAssignments: IJigAssignment[],
): string => {
  if (j.dispatchedAt) return "Dispatched";
  if (isReady(j, jigAssignments)) return "Ready to dispatch";
  if (jigsOf(j.id, jigAssignments).some((g) => g.status === "ACTIVE"))
    return "WIP";
  return "Intake";
};

export const stageBadge = (
  j: IJob,
  jigAssignments: IJigAssignment[],
): string => {
  if (j.dispatchedAt) return "b-done";
  if (isReady(j, jigAssignments)) return "b-dispatch";
  if (jigsOf(j.id, jigAssignments).some((g) => g.status === "ACTIVE"))
    return "b-jig";
  return "b-intake";
};

// ================ Customer Resolution ================ //

export const resolveCustomer = (
  n: string,
  contacts: IContact[],
): IContact | null => {
  if (!n || !contacts.length) return null;
  const trimmedName = n.trim();
  const searchTerm = trimmedName.toLowerCase();

  console.log("🔍 resolveCustomer - Input:", n);
  console.log("🔍 resolveCustomer - searchTerm (lowercased):", searchTerm);

  // Aliases
  if (searchTerm.includes("sokoza"))
    return contacts.find((c) => c.account === "SOKO") || null;
  if (searchTerm.includes("nz manufacturing"))
    return contacts.find((c) => c.account === "NZMFG") || null;
  if (searchTerm.includes("baytex"))
    return contacts.find((c) => c.account === "BAYT") || null;

  // Exact match (name or alias)
  let c = contacts.find(
    (x) =>
      x.name.toLowerCase() === searchTerm ||
      x.alias?.some((n) => n === searchTerm),
  );
  if (c) {
    console.log("✅ Found exact match:", c.name);
    return c;
  }

  // Fuzzy match (fallback) - check name and aliases
  c = contacts.find(
    (x) =>
      searchTerm.includes(x.name.toLowerCase()) ||
      x.name.toLowerCase().includes(searchTerm) ||
      x.alias?.some(
        (alias) => searchTerm.includes(alias) || alias.includes(searchTerm),
      ),
  );
  if (c) {
    console.log("✅ Found fuzzy match:", c.name);
    return c;
  }

  // Account code match
  c = contacts.find((x) => x.account.toLowerCase() === searchTerm);
  if (c) {
    console.log("✅ Found by account code:", c.name);
    return c;
  }

  console.log("❌ No match found for:", searchTerm);
  return null;
};

// ================ Price Calculation ================ //

export const calcJobTotal = (j: IJob): number => {
  let sum = 0;
  j.parts.forEach((p) => {
    sum += (p.price || 0) * (p.qty || 1);
  });

  return sum;
};

export const hasMinCharge = (j: IJob) => {
  return calcJobTotal(j) === 0;
};

export const calcPrice = (j: IJob, settings: ISettings): number => {
  const minCharges = calculateMinCharges(settings);
  const minC = minCharges[j.plating] || 60;
  const freight = j.freightRequested ? j.freightCost || 0 : 0;

  if (j.priceOverride != null) {
    return Math.round((j.priceOverride + freight) * 100) / 100;
  }

  // Priced parts override weight/string pricing entirely
  let sum = calcJobTotal(j);

  if (hasMinCharge(j)) {
    const rates = calculateRates(settings);
    const rate = rates[j.plating] || rates.silver;

    if (j.requiresWeighing && j.weightKg) {
      sum += j.weightKg * rate.kg;
    }

    if (j.stringsRequired && j.stringCount) {
      sum += j.stringCount * (settings.stringRate || 25);
    }
  }

  if (sum < minC) {
    sum = minC;
  }

  return Math.round((sum + freight) * 100) / 100;
};

// ================ Image Processing ================ //

export const fixOrientation = (
  dataUrl: string,
  cb: (processed: string, rotated: boolean) => void,
) => {
  const img = new Image();
  img.onload = () => {
    const w = img.width;
    const h = img.height;
    const isLandscape = w > h;

    let canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    // Don't auto-rotate - keep original orientation
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0);

    // Cap dimension (reduced for mobile compatibility and faster server action serialization)
    const maxDim = 1600; // Reduced from 2400 - still excellent quality for OCR
    if (canvas.width > maxDim || canvas.height > maxDim) {
      const scale = maxDim / Math.max(canvas.width, canvas.height);
      const newW = Math.floor(canvas.width * scale);
      const newH = Math.floor(canvas.height * scale);
      const canvas2 = document.createElement("canvas");
      canvas2.width = newW;
      canvas2.height = newH;
      const ctx2 = canvas2.getContext("2d")!;
      ctx2.drawImage(canvas, 0, 0, newW, newH);
      canvas = canvas2;
    }

    // Compress (reduced for mobile - prevents RSC "Maximum array nesting" error)
    let quality = 0.75; // Reduced from 0.82
    let result = canvas.toDataURL("image/jpeg", quality);
    const maxSize = 1.5 * 1024 * 1024; // Reduced from 5.4MB to 1.5MB per image

    while (result.length > maxSize && quality > 0.3) {
      quality -= 0.05;
      result = canvas.toDataURL("image/jpeg", quality);
    }

    cb(result, isLandscape);
  };
  img.src = dataUrl;
};
