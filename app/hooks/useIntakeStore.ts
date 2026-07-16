import { create } from "zustand";
import type { IContact, IPart, IJob } from "@/types/interfaces";
import type { TPlating } from "@/types/types";
import type { ScanPOResponse } from "@/api/scan-po/route";

interface IntakeFormState {
  // UI state
  showSheet: boolean;
  currentJob: IJob | null;
  editingJobId: string | null;

  // Customer fields
  customer: IContact | null;
  customerInput: string;
  showCustomerDropdown: boolean;

  // Job details
  po_number: string;
  contactNumber: string;
  partsDescription: string;
  parts: IPart[];
  plating: TPlating;
  notes: string;

  // Flags
  urgent: boolean;
  isInternal: boolean;
  flagged: boolean;
  stringsRequired: boolean;
  stringCount: number;
  requiresWeighing: boolean;
  freightRequested: boolean;
  minCharge: boolean;

  // Images
  poPages: string[];
  partsOnArrivalPhotos: string[];

  // Scan state
  scanning: boolean;
  scanResult: string;
  scanData: ScanPOResponse | null;
  showRawData: boolean;

  // Part search
  partSearchIndex: number | null;
  partSearchTerm: string;
}

interface IntakeFormActions {
  // UI actions
  setShowSheet: (show: boolean) => void;
  setCurrentJob: (job: IJob | null) => void;
  setEditingJobId: (id: string | null) => void;
  openJobSheet: (job: IJob) => void;
  openJobForEdit: (job: IJob, customer: IContact | null) => void;
  closeSheet: () => void;

  // Customer actions
  setCustomer: (customer: IContact | null) => void;
  setCustomerInput: (input: string) => void;
  setShowCustomerDropdown: (show: boolean) => void;

  // Job detail actions
  setPoNumber: (po: string) => void;
  setContactNumber: (contact: string) => void;
  setPartsDescription: (desc: string) => void;
  setParts: (parts: IPart[]) => void;
  setPlating: (plating: TPlating) => void;
  setNotes: (notes: string) => void;

  // Flag actions
  setUrgent: (urgent: boolean) => void;
  setIsInternal: (isInternal: boolean) => void;
  setFlagged: (flagged: boolean) => void;
  setStringsRequired: (required: boolean) => void;
  setStringCount: (count: number) => void;
  setRequiresWeighing: (required: boolean) => void;
  setFreightRequested: (requested: boolean) => void;
  setMinCharge: (minCharge: boolean) => void;

  // Image actions
  setPoPages: (pages: string[]) => void;
  addPoPages: (pages: string[]) => void;
  removePoPage: (index: number) => void;
  setPartsOnArrivalPhotos: (photos: string[]) => void;
  addPartsPhotos: (photos: string[]) => void;
  removePartsPhoto: (index: number) => void;

  // Scan actions
  setScanning: (scanning: boolean) => void;
  setScanResult: (result: string) => void;
  setScanData: (data: ScanPOResponse | null) => void;
  setShowRawData: (show: boolean) => void;
  applyScanResult: (result: ScanPOResponse) => void;
  setScanError: (error: string) => void;

  // Part search actions
  setPartSearchIndex: (index: number | null) => void;
  setPartSearchTerm: (term: string) => void;
  updatePart: (index: number, field: keyof IPart, value: IPart[keyof IPart]) => void;
  addPart: () => void;
  removePart: (index: number) => void;

  // Reset
  resetForm: () => void;
}

type IntakeStore = IntakeFormState & IntakeFormActions;

const initialState: IntakeFormState = {
  showSheet: false,
  currentJob: null,
  editingJobId: null,
  customer: null,
  customerInput: "",
  showCustomerDropdown: false,
  po_number: "",
  contactNumber: "",
  partsDescription: "",
  parts: [],
  plating: "silver",
  notes: "",
  urgent: false,
  isInternal: false,
  flagged: false,
  stringsRequired: false,
  stringCount: 0,
  requiresWeighing: false,
  freightRequested: false,
  minCharge: false,
  poPages: [],
  partsOnArrivalPhotos: [],
  scanning: false,
  scanResult: "",
  scanData: null,
  showRawData: false,
  partSearchIndex: null,
  partSearchTerm: "",
};

export const useIntakeStore = create<IntakeStore>((set) => ({
  ...initialState,

  // UI actions
  setShowSheet: (showSheet) => set({ showSheet }),
  setCurrentJob: (currentJob) => set({ currentJob }),
  setEditingJobId: (editingJobId) => set({ editingJobId }),
  openJobSheet: (job) => set({ currentJob: job, showSheet: false }),
  openJobForEdit: (job, customer) =>
    set({
      editingJobId: job.id,
      customer,
      customerInput: customer?.name || job.customer_name,
      po_number: job.po_number,
      contactNumber: job.customer_contact || "",
      partsDescription: job.partDescription || "",
      parts: job.parts,
      plating: job.plating,
      notes: job.notes,
      urgent: job.urgent,
      isInternal: job.isInternal,
      flagged: job.flagged,
      stringsRequired: job.stringsRequired,
      stringCount: job.stringCount,
      requiresWeighing: job.requiresWeighing,
      freightRequested: job.freightRequested,
      minCharge: job.minCharge,
      poPages: [],
      partsOnArrivalPhotos: [],
      showSheet: true,
    }),
  closeSheet: () => set({ ...initialState }),

  // Customer actions
  setCustomer: (customer) => set({ customer }),
  setCustomerInput: (customerInput) => set({ customerInput }),
  setShowCustomerDropdown: (showCustomerDropdown) => set({ showCustomerDropdown }),

  // Job detail actions
  setPoNumber: (po_number) => set({ po_number }),
  setContactNumber: (contactNumber) => set({ contactNumber }),
  setPartsDescription: (partsDescription) => set({ partsDescription }),
  setParts: (parts) => set({ parts }),
  setPlating: (plating) => set({ plating }),
  setNotes: (notes) => set({ notes }),

  // Flag actions
  setUrgent: (urgent) => set({ urgent }),
  setIsInternal: (isInternal) => set({ isInternal }),
  setFlagged: (flagged) => set({ flagged }),
  setStringsRequired: (stringsRequired) => set({ stringsRequired }),
  setStringCount: (stringCount) => set({ stringCount }),
  setRequiresWeighing: (requiresWeighing) => set({ requiresWeighing }),
  setFreightRequested: (freightRequested) => set({ freightRequested }),
  setMinCharge: (minCharge) => set({ minCharge }),

  // Image actions
  setPoPages: (poPages) => set({ poPages }),
  addPoPages: (newPages) =>
    set((state) => ({ poPages: [...state.poPages, ...newPages] })),
  removePoPage: (index) =>
    set((state) => ({ poPages: state.poPages.filter((_, i) => i !== index) })),
  setPartsOnArrivalPhotos: (partsOnArrivalPhotos) => set({ partsOnArrivalPhotos }),
  addPartsPhotos: (newPhotos) =>
    set((state) => ({
      partsOnArrivalPhotos: [...state.partsOnArrivalPhotos, ...newPhotos],
    })),
  removePartsPhoto: (index) =>
    set((state) => ({
      partsOnArrivalPhotos: state.partsOnArrivalPhotos.filter((_, i) => i !== index),
    })),

  // Scan actions
  setScanning: (scanning) => set({ scanning }),
  setScanResult: (scanResult) => set({ scanResult }),
  setScanData: (scanData) => set({ scanData }),
  setShowRawData: (showRawData) => set({ showRawData }),
  applyScanResult: (result) =>
    set((state) => ({
      po_number: result.po_number || state.po_number,
      customer: result.customer || state.customer,
      customerInput: result.customer?.name || state.customerInput,
      parts: result.parts.length > 0 ? result.parts : state.parts,
      urgent: result.urgent || state.urgent,
      scanData: result,
      scanResult: `✓ Customer: ${result.customer?.name || result.customer_name || "Unknown"} → ${result.customer?.account || ""}\n${result.parts.filter((p: IPart) => p.price > 0).length} parts matched to inventory`,
      scanning: false,
    })),
  setScanError: (error) =>
    set({
      scanResult: `Error: ${error}`,
      scanData: null,
      scanning: false,
    }),

  // Part search actions
  setPartSearchIndex: (partSearchIndex) => set({ partSearchIndex }),
  setPartSearchTerm: (partSearchTerm) => set({ partSearchTerm }),
  updatePart: (index, field, value) =>
    set((state) => {
      const updated = [...state.parts];
      updated[index] = { ...updated[index], [field]: value };
      return { parts: updated };
    }),
  addPart: () =>
    set((state) => ({
      parts: [...state.parts, { code: "", desc: "", qty: 1, price: 0 }],
    })),
  removePart: (index) =>
    set((state) => ({ parts: state.parts.filter((_, i) => i !== index) })),

  // Reset
  resetForm: () => set(initialState),
}));
