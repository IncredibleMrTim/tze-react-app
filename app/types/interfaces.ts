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

export interface IJigAssignment {
  id: string;
  jobId: string;
  jigName: string;
  pct: number;
  pic: string | null;
  completedAt: number | null;
  loadedAt: number;
  status: 'ACTIVE' | 'CLEARED';
}

export interface ISettings {
  apiKey: string;
  silverKg: number;
  goldKg: number;
  silverJig: number;
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
