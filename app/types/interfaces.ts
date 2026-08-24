import type { TPlating } from "@/types/types";

export interface IContact {
  name: string;
  account: string;
  alias: string[];
  email: string;
}

export interface IItem {
  customer: string;
  code: string;
  desc: string;
  price: number;
}

export interface IPart {
  code: string;
  desc: string;
  qty: number;
  price: number;
}

export interface IScannedPart {
  code: string;
  description: string;
  quantity: number;
}

export interface IJob {
  id: string;
  po_number: string;
  customer_name: string;
  customer_account: string;
  customer_email: string;
  customer_contact: string;
  parts: IPart[];
  plating: TPlating;
  weightKg: number;
  stringCount: number;
  stringsRequired: boolean;
  requiresWeighing: boolean;
  freightRequested: boolean;
  minCharge: boolean;
  flagged: boolean;
  notes: string;
  poPages?: string[]; // Optional - excluded from list queries for performance
  partsOnArrivalPhotos?: string[]; // Optional - excluded from list queries for performance
  manualPO: boolean;
  urgent: boolean;
  isInternal: boolean;
  isRework: boolean;
  partDescription: string;
  createdAt: number;
  priceOverride: number | null;
  freightCost: number;
  dispatchedAt: number | null;
  invoiceNumber: string | null;
  poComplete: boolean;
  fpnDownloaded: boolean;
  fpnHidden: boolean;
  csvDownloaded: boolean;
}

export interface IJig {
  id: string;
  name: string;
}

export interface IJigAssignment {
  id: string;
  jobId: string;
  jigId: string;
  jigName: string;
  pct: number;
  pic: string | null;
  photoId: string | null;
  completedAt: number | null;
  loadedAt: number;
  status: "ACTIVE" | "CLEARED";
  // Only populated by getJigAssignments() — the minimal job fields needed
  // to render "jobs on this jig" without a separate full-job-table fetch.
  job?: Pick<IJob, "po_number" | "customer_name" | "plating" | "poComplete">;
}

export interface IJigPhoto {
  id: string;
  jigId: string;
  photoData: string;
  createdAt: number;
}

export interface ISettings {
  silverKg: number;
  goldKg: number;
  silverJig: number;
  goldMinCharge: number;
  silverMinCharge: number;
  goldJig: number;
  dueDays: number;
  jigCount: number;
  invSeqStart: number;
  invSeq: number;
  stringRate: number;
}

export interface IPoRule {
  id: number;
  contactAccount: string;
  ruleType: string;
  scanningRules: string;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPoRulesResult {
  success: boolean;
  rules: IPoRule[];
  error?: string;
}

export interface IIntakeFormState {
  manualPO: boolean;
  po_number: string;
  customer: IContact | null;
  customer_contact: string;
  parts: IPart[];
  expandedPart: number;
  plating: TPlating;
  weightKg: number;
  stringCount: number;
  stringsRequired: boolean;
  requiresWeighing: boolean;
  freightRequested: boolean;
  minCharge: boolean;
  flagged: boolean;
  notes: string;
  poPages: string[];
  partsOnArrivalPhotos: string[];
  scannedParts: IScannedPart[];
  editId: string | null;
  urgent: boolean;
  isInternal: boolean;
  partDescription: string;
  _scanRaw: string;
  _returnToDispatch: boolean;
}

export interface IStorageState {
  jobs: IJob[];
  jigAssignments: IJigAssignment[];
  jigPhotos: Record<string, string>;
  invSeq: number;
  nextTZE: number;
}
