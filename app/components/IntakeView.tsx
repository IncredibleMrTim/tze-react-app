"use client";

import { useState, useRef } from "react";
import type {
  IJob,
  IContact,
  IPart,
  ISettings,
  IItem,
  IJigAssignment,
} from "@/types/interfaces";
import type { TPlating } from "@/types/types";
import { Overlay } from "@/components/Overlay";
import { CONTACTS, fixOrientation } from "@/lib/helpers";
import { scanPODocument } from "@/app/actions/scan-po";
import ITEMS from "@/data/items.json";

interface IntakeViewProps {
  settings: ISettings;
  jobs: IJob[];
  jigA: IJigAssignment[];
  onSave: (job: IJob) => void;
  onUpdateJob: (job: IJob) => void;
  onDeleteJob: (jobId: string) => void;
  onShowToast: (msg: string) => void;
}

export const IntakeView: React.FC<IntakeViewProps> = ({
  settings,
  jobs,
  jigA,
  onSave,
  onUpdateJob,
  onDeleteJob,
  onShowToast,
}) => {
  const [showSheet, setShowSheet] = useState(false);
  const [selectedJob, setSelectedJob] = useState<IJob | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<IContact | null>(null);
  const [customerInput, setCustomerInput] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [po_number, setPoNumber] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [partsDescription, setPartsDescription] = useState("");
  const [parts, setParts] = useState<IPart[]>([]);
  const [plating, setPlating] = useState<TPlating>("silver");
  const [notes, setNotes] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [isInternal, setIsInternal] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [stringsRequired, setStringsRequired] = useState(false);
  const [stringCount, setStringCount] = useState(0);
  const [requiresWeighing, setRequiresWeighing] = useState(false);
  const [freightRequested, setFreightRequested] = useState(false);
  const [minCharge, setMinCharge] = useState(false);
  const [poPic, setPoPic] = useState<string | null>(null);
  const [partsPic, setPartsPic] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [partSearchIndex, setPartSearchIndex] = useState<number | null>(null);
  const [partSearchTerm, setPartSearchTerm] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const partsPhotoInputRef = useRef<HTMLInputElement>(null);

  const filteredCustomers = CONTACTS.filter(
    (c) =>
      c.name.toLowerCase().includes(customerInput.toLowerCase()) ||
      c.account.toLowerCase().includes(customerInput.toLowerCase()),
  ).slice(0, 10);

  const handleScanPO = async (file: File) => {
    setScanning(true);
    setScanResult("");

    try {
      // Read and process the file
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          fixOrientation(result, resolve);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Extract base64 data (remove data:image/jpeg;base64, prefix)
      const base64Data = dataUrl.split(",")[1];

      // Call server action
      const result = await scanPODocument(base64Data);

      // Set PO number
      if (result.po_number) {
        setPoNumber(result.po_number);
      }

      // Set customer
      if (result.customer) {
        setCustomer(result.customer);
        setCustomerInput(result.customer.name);
      }

      // Set parts
      if (result.parts.length > 0) {
        setParts(result.parts);
      }

      // Set urgent flag
      if (result.urgent) {
        setUrgent(true);
      }

      setScanResult(
        `✓ Scanned: ${result.customer_name || "Unknown"} - ${result.parts.length} parts found`,
      );
      onShowToast("PO scanned successfully");
    } catch (err: any) {
      setScanResult(`Error: ${err.message}`);
      onShowToast("Scan failed: " + err.message);
    } finally {
      setScanning(false);
    }
  };

  const handlePartsPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPartsPic(reader.result as string);
      onShowToast("Parts photo added");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!customer && !isInternal) {
      onShowToast("Please select a customer");
      return;
    }

    if (!po_number.trim()) {
      onShowToast("Please enter a PO number");
      return;
    }

    // Check for duplicate PO (only when creating new job)
    if (!editingJobId && jobs.some((j) => j.po_number === po_number)) {
      onShowToast("PO number already exists");
      return;
    }

    if (editingJobId) {
      // Update existing job
      const existingJob = jobs.find((j) => j.id === editingJobId);
      if (!existingJob) return;

      const updatedJob: IJob = {
        ...existingJob,
        po_number,
        customer_name: customer?.name || "Internal",
        customer_account: customer?.account || "",
        customer_email: customer?.email || "",
        customer_contact: contactNumber,
        parts,
        plating,
        stringCount,
        stringsRequired,
        requiresWeighing,
        freightRequested,
        minCharge,
        flagged,
        notes,
        poPic,
        partsPic,
        urgent,
        isInternal,
        partDescription: partsDescription,
      };

      onUpdateJob(updatedJob);
      resetForm();
      setShowSheet(false);
      onShowToast("Job updated: " + po_number);
    } else {
      // Create new job
      const job: IJob = {
        id: Date.now().toString(),
        po_number,
        customer_name: customer?.name || "Internal",
        customer_account: customer?.account || "",
        customer_email: customer?.email || "",
        customer_contact: contactNumber,
        parts,
        plating,
        weightKg: 0,
        stringCount,
        stringsRequired,
        requiresWeighing,
        freightRequested,
        minCharge,
        flagged,
        notes,
        poPic,
        partsPic,
        manualPO: false,
        urgent,
        isInternal,
        isRework: false,
        partDescription: partsDescription,
        createdAt: Date.now(),
        priceOverride: null,
        freightCost: 0,
        dispatchedAt: null,
        invoiceNumber: null,
        poComplete: false,
        fpnDownloaded: false,
        fpnHidden: false,
        csvDownloaded: false,
      };

      onSave(job);
      resetForm();
      setShowSheet(false);
      onShowToast("Job created: " + po_number);
    }
  };

  const resetForm = () => {
    setCustomer(null);
    setCustomerInput("");
    setPoNumber("");
    setContactNumber("");
    setPartsDescription("");
    setParts([]);
    setPlating("silver");
    setNotes("");
    setUrgent(false);
    setIsInternal(false);
    setFlagged(false);
    setStringsRequired(false);
    setStringCount(0);
    setRequiresWeighing(false);
    setFreightRequested(false);
    setMinCharge(false);
    setPoPic(null);
    setPartsPic(null);
    setScanResult("");
    setEditingJobId(null);
  };

  const addPart = () => {
    setParts([...parts, { code: "", desc: "", qty: 1, price: 0 }]);
  };

  const updatePart = (index: number, field: keyof IPart, value: any) => {
    const updated = [...parts];
    updated[index] = { ...updated[index], [field]: value };
    setParts(updated);
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handlePartCodeChange = (index: number, value: string) => {
    updatePart(index, "code", value);
    setPartSearchIndex(index);
    setPartSearchTerm(value);
  };

  const selectItem = (index: number, item: IItem) => {
    updatePart(index, "code", item.code);
    updatePart(index, "desc", item.desc);
    updatePart(index, "price", item.price);
    setPartSearchIndex(null);
    setPartSearchTerm("");
  };

  const getFilteredItems = () => {
    if (!partSearchTerm || partSearchTerm.length < 2) return [];

    const term = partSearchTerm.toLowerCase();
    return ITEMS.filter((item) => {
      // Match search term
      const matchesTerm =
        item.code.toLowerCase().includes(term) ||
        item.desc.toLowerCase().includes(term);

      // Filter by customer if one is selected (not for internal jobs)
      const matchesCustomer =
        !customer || isInternal || item.customer === customer.account;

      return matchesTerm && matchesCustomer;
    }).slice(0, 10);
  };

  const getJobStatus = (job: IJob) => {
    if (job.dispatchedAt) return "Dispatched";
    if (job.poComplete) return "Ready";
    return "Intake";
  };

  const formatJobDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) return "TODAY";

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "YESTERDAY";

    return date
      .toLocaleDateString("en-NZ", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
      .toUpperCase();
  };

  const groupJobsByDate = () => {
    const groups: Record<string, IJob[]> = {};
    const undispatchedJobs = jobs.filter((j) => !j.dispatchedAt);

    undispatchedJobs.forEach((job) => {
      const dateLabel = formatJobDate(job.createdAt);
      if (!groups[dateLabel]) groups[dateLabel] = [];
      groups[dateLabel].push(job);
    });

    return groups;
  };

  return (
    <div className="relative h-full">
      {/* Header with job count and FAB */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="text-base text-gray-600">
          On floor:{" "}
          <span className="font-semibold text-gray-900">
            {jobs.length} jobs
          </span>
        </div>
        <button
          onClick={() => setShowSheet(true)}
          className="w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-emerald-700 active:scale-95 transition-all"
          aria-label="Add new job"
        >
          +
        </button>
      </div>

      {/* Empty state */}
      {jobs.length === 0 && (
        <div className="text-center py-16">
          <div className="text-7xl mb-4">🏭</div>
          <div className="text-xl font-semibold text-gray-800 mb-2">
            Shop floor clear
          </div>
          <div className="text-base text-gray-500">Tap + to log a new job</div>
        </div>
      )}

      {/* Job list grouped by date */}
      {jobs.length > 0 && !selectedJob && (
        <div className="space-y-4">
          {Object.entries(groupJobsByDate()).map(([dateLabel, dateJobs]) => (
            <div key={dateLabel}>
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {dateLabel}
              </div>
              {dateJobs.map((job) => {
                const hasJig = jigA.some(
                  (g) => g.jobId === job.id && !g.completedAt,
                );
                const status = getJobStatus(job);
                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`border-2 rounded-xl p-3.5 mb-2.5 cursor-pointer active:scale-[0.98] transition-all ${
                      job.urgent
                        ? "border-red-400 bg-red-50"
                        : job.flagged
                          ? "border-orange-400 bg-orange-50"
                          : "border-gray-200 bg-white hover:border-primary"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-base">
                            {job.po_number}
                          </span>
                          {job.urgent && (
                            <span className="flex items-center gap-1 text-xs font-medium text-red-700">
                              <span className="w-2 h-2 rounded-full bg-red-600"></span>
                              URGENT
                            </span>
                          )}
                        </div>
                        <div className="text-[13px] text-gray-600 mb-1">
                          {job.customer_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Arrived:{" "}
                          {new Date(job.createdAt).toLocaleDateString("en-NZ", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          {new Date(job.createdAt).toLocaleTimeString("en-NZ", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </div>
                        {job.partDescription && (
                          <div className="text-sm text-gray-700 italic mt-1">
                            {job.partDescription}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {hasJig ? "On JIG" : "No JIG"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full bg-green-600"></span>
                        <span className="text-gray-600">{status}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-700">
                        {job.plating === "gold" ? "Gold" : "Silver"}
                      </span>
                      {job.stringsRequired && (
                        <span className="text-blue-700 flex items-center gap-1">
                          🎗️ Strings needed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Job Detail View */}
      {selectedJob && (
        <div className="pb-20">
          {/* Back button and actions */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedJob(null)}
              className="flex items-center gap-1 text-primary font-medium text-sm"
            >
              ← New Job
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (window.confirm(`Delete job ${selectedJob.po_number}?`)) {
                    onDeleteJob(selectedJob.id);
                    setSelectedJob(null);
                    onShowToast("Job deleted");
                  }
                }}
                className="px-4 py-1.5 border-2 border-red-500 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setEditingJobId(selectedJob.id);
                  setCustomer(
                    CONTACTS.find(
                      (c) => c.name === selectedJob.customer_name,
                    ) || null,
                  );
                  setCustomerInput(selectedJob.customer_name);
                  setPoNumber(selectedJob.po_number);
                  setContactNumber(selectedJob.customer_contact || "");
                  setPartsDescription(selectedJob.partDescription || "");
                  setParts(selectedJob.parts);
                  setPlating(selectedJob.plating);
                  setNotes(selectedJob.notes);
                  setUrgent(selectedJob.urgent);
                  setIsInternal(selectedJob.isInternal);
                  setFlagged(selectedJob.flagged);
                  setStringsRequired(selectedJob.stringsRequired);
                  setStringCount(selectedJob.stringCount);
                  setRequiresWeighing(selectedJob.requiresWeighing);
                  setFreightRequested(selectedJob.freightRequested);
                  setMinCharge(selectedJob.minCharge);
                  setPoPic(selectedJob.poPic);
                  setPartsPic(selectedJob.partsPic);
                  setSelectedJob(null);
                  setShowSheet(true);
                  onShowToast("Editing job");
                }}
                className="px-4 py-1.5 border-2 border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary-bg"
              >
                Edit
              </button>
            </div>
          </div>

          {/* Job header */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-xl">{selectedJob.po_number}</span>
              {selectedJob.urgent && (
                <span className="flex items-center gap-1 text-sm font-medium text-red-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                  URGENT
                </span>
              )}
            </div>
            <div className="text-base text-gray-700 mb-1">
              {selectedJob.customer_name}
            </div>
            {selectedJob.customer_contact && (
              <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                📞 {selectedJob.customer_contact}
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <span className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs font-medium text-gray-700">
                {getJobStatus(selectedJob)}
              </span>
              <span className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs font-medium text-gray-700">
                {selectedJob.plating === "gold" ? "Gold" : "Silver"}
              </span>
            </div>
          </div>

          {/* PARTS Section */}
          {selectedJob.parts.length > 0 && (
            <div className="mb-4">
              <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                PARTS
              </h3>
              {selectedJob.parts.map((part, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 rounded-lg p-3 mb-2 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {part.desc}
                    </div>
                    <div className="text-xs text-gray-500">{part.code}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      ×{part.qty}
                    </div>
                    <div className="text-xs text-gray-600">
                      ${part.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PARTS ON ARRIVAL */}
          {selectedJob.partsPic && (
            <div className="mb-4">
              <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                PARTS ON ARRIVAL
              </h3>
              <img
                src={selectedJob.partsPic}
                alt="Parts on arrival"
                className="w-full rounded-lg"
              />
            </div>
          )}

          {/* JIG ASSIGNMENTS */}
          <div className="mb-4">
            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              JIG ASSIGNMENTS
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
              No JIG assigned yet — assign from the JIG tab when loading.
            </div>
          </div>

          {/* PARTS DESCRIPTION */}
          {selectedJob.partDescription && (
            <div className="mb-4">
              <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                PARTS DESCRIPTION
              </h3>
              <div className="text-sm text-gray-700">
                {selectedJob.partDescription}
              </div>
            </div>
          )}

          {/* JOB TIMELINE */}
          <div className="mb-4">
            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              JOB TIMELINE
            </h3>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📬</span>
              <div>
                <div className="font-semibold text-sm text-gray-900">
                  Arrived
                </div>
                <div className="text-xs text-gray-600">
                  {new Date(selectedJob.createdAt).toLocaleDateString("en-NZ", {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  {new Date(selectedJob.createdAt).toLocaleTimeString("en-NZ", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSheet && (
        <Overlay onClose={() => setShowSheet(false)}>
          <div className="px-4 pt-5">
            <div className="w-9 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <h2 className="text-[17px] font-bold mb-4">Enter Job</h2>

            {/* SCAN PO Section */}
            <div className="mb-5">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                SCAN PO —{" "}
                <span className="font-normal normal-case text-gray-400">
                  Claude auto-fills the form
                </span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleScanPO(file);
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={scanning}
                className="w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg py-8 text-gray-500 text-sm disabled:opacity-50 flex flex-col items-center gap-2"
              >
                <div className="text-3xl">📷</div>
                <div className="font-medium text-gray-700">
                  {scanning ? "Scanning..." : "Tap to photograph PO"}
                </div>
                <div className="text-xs text-gray-500">
                  Claude reads customer, PO number & parts
                </div>
              </button>
              {scanResult && (
                <div
                  className={`text-sm mt-2 px-3 py-2 rounded ${
                    scanResult.startsWith("✓")
                      ? "bg-green-50 text-green-800"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  {scanResult}
                </div>
              )}
            </div>

            {/* CUSTOMER Section */}
            <div className="mb-5">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                CUSTOMER
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customerInput}
                  onChange={(e) => {
                    setCustomerInput(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Search customer..."
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-3 text-base outline-none focus:border-primary"
                />
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 border-t-0 rounded-b-lg max-h-[200px] overflow-y-auto z-[500] shadow-lg">
                    {filteredCustomers.map((c) => (
                      <div
                        key={c.account}
                        onClick={() => {
                          setCustomer(c);
                          setCustomerInput(c.name);
                          setShowCustomerDropdown(false);
                        }}
                        className="px-3 py-3 cursor-pointer border-b border-gray-100 hover:bg-green-50 active:bg-primary-bg"
                      >
                        <div className="text-[15px]">{c.name}</div>
                        <div className="text-[12px] text-gray-500">
                          {c.account}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {customer && (
                <div className="text-[12px] text-emerald-900 mt-2 px-2 py-1.5 bg-primary-bg rounded">
                  ✓ {customer.name} ({customer.account})
                </div>
              )}
            </div>

            {/* PO Number */}
            <div className="mb-4">
              <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
                PO number{" "}
                <span className="text-gray-400 font-normal text-xs">
                  (leave blank to auto-assign)
                </span>
              </label>
              <input
                type="text"
                value={po_number}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="Customer PO number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base outline-none focus:border-primary"
              />
            </div>

            {/* Contact Number */}
            <div className="mb-4">
              <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
                Contact number{" "}
                <span className="text-gray-400 font-normal text-xs">
                  (optional)
                </span>
              </label>
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. 021 123 4567"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base outline-none focus:border-primary"
              />
            </div>

            {/* Parts Description */}
            <div className="mb-5">
              <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
                Parts description{" "}
                <span className="text-gray-400 font-normal text-xs">
                  (optional — shows on job card)
                </span>
              </label>
              <input
                type="text"
                value={partsDescription}
                onChange={(e) => setPartsDescription(e.target.value)}
                placeholder="e.g. roller pins x50, swing arms"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base outline-none focus:border-primary"
              />
            </div>

            {/* PLATING Section */}
            <div className="mb-5">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                PLATING
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPlating("silver")}
                  className={`flex-1 py-2.5 border rounded-lg text-sm font-medium ${
                    plating === "silver"
                      ? "border-gray-400 bg-white text-gray-900"
                      : "border-gray-300 text-gray-500 bg-gray-50"
                  }`}
                >
                  Silver (zinc bright)
                </button>
                <button
                  onClick={() => setPlating("gold")}
                  className={`flex-1 py-2.5 border rounded-lg text-sm font-medium ${
                    plating === "gold"
                      ? "border-gray-400 bg-white text-gray-900"
                      : "border-gray-300 text-gray-500 bg-gray-50"
                  }`}
                >
                  Gold (zinc yellow)
                </button>
              </div>
            </div>

            {/* JIG RATE OPTIONS Section */}
            <div className="mb-5">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                JIG RATE OPTIONS —{" "}
                <span className="font-normal normal-case text-gray-400">
                  fill in if no part prices on PO
                </span>
              </label>

              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      Strings required
                    </div>
                    <div className="text-xs text-gray-500">
                      JIG cannot complete until string count is entered
                    </div>
                  </div>
                  <label className="relative inline-block w-12 h-6 ml-3">
                    <input
                      type="checkbox"
                      checked={stringsRequired}
                      onChange={(e) => setStringsRequired(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-primary transition-colors cursor-pointer"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                  </label>
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      Requires weighing
                    </div>
                    <div className="text-xs text-gray-500">
                      Dispatch blocked until weight is entered
                    </div>
                  </div>
                  <label className="relative inline-block w-12 h-6 ml-3">
                    <input
                      type="checkbox"
                      checked={requiresWeighing}
                      onChange={(e) => setRequiresWeighing(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-primary transition-colors cursor-pointer"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* PARTS Section */}
            <div className="mb-5">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                PARTS ({parts.length}/15)
              </label>

              {!customer && !isInternal && (
                <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-lg border border-gray-200">
                  Select a customer first
                </div>
              )}

              {(customer || isInternal) && (
                <div>
                  {parts.map((part, i) => (
                    <div
                      key={i}
                      className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500 uppercase">
                          Part {i + 1}
                        </span>
                        <button
                          onClick={() => removePart(i)}
                          className="text-red-600 hover:text-red-800 font-semibold text-sm"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="relative mb-2">
                        <label className="text-xs text-gray-600 mb-1 block">
                          Part code
                        </label>
                        <input
                          type="text"
                          value={part.code}
                          onChange={(e) =>
                            handlePartCodeChange(i, e.target.value)
                          }
                          onFocus={() => {
                            setPartSearchIndex(i);
                            setPartSearchTerm(part.code);
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setPartSearchIndex(null);
                              setPartSearchTerm("");
                            }, 200);
                          }}
                          placeholder="Type code or description..."
                          className="w-full border-2 border-primary rounded px-3 py-2 text-sm outline-none focus:border-primary"
                        />

                        {partSearchIndex === i &&
                          getFilteredItems().length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white border-2 border-primary border-t-0 rounded-b-lg max-h-[300px] overflow-y-auto z-[500] shadow-lg">
                              {getFilteredItems().map((item, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => selectItem(i, item)}
                                  className="px-3 py-2 cursor-pointer hover:bg-green-50 border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-semibold text-sm text-gray-900">
                                    {item.code}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {item.desc} — ${item.price.toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>

                      <input
                        type="text"
                        value={part.desc}
                        onChange={(e) => updatePart(i, "desc", e.target.value)}
                        placeholder="Search or type description..."
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-2 outline-none focus:border-primary"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">
                            Price per part ($)
                          </label>
                          <input
                            type="number"
                            value={part.price}
                            onChange={(e) =>
                              updatePart(
                                i,
                                "price",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            placeholder="0.00"
                            step="0.01"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">
                            Quantity
                          </label>
                          <input
                            type="number"
                            value={part.qty}
                            onChange={(e) =>
                              updatePart(
                                i,
                                "qty",
                                parseInt(e.target.value) || 1,
                              )
                            }
                            placeholder="1"
                            min="1"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addPart}
                    disabled={parts.length >= 15}
                    className="w-full bg-white border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-600 font-medium hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    + Add part
                  </button>
                </div>
              )}
            </div>

            {/* PARTS / ARRIVAL PHOTO Section */}
            <div className="mb-5">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                PARTS / ARRIVAL PHOTO{" "}
                <span className="text-gray-400 font-normal normal-case">
                  (optional)
                </span>
              </label>
              <input
                ref={partsPhotoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePartsPhoto(file);
                }}
              />
              {!partsPic ? (
                <button
                  onClick={() => partsPhotoInputRef.current?.click()}
                  className="w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg py-6 text-gray-500 text-sm flex flex-col items-center gap-2 hover:border-gray-400 transition-colors"
                >
                  <div className="text-2xl">📦</div>
                  <div className="font-medium text-gray-700">
                    Tap to photograph parts on arrival
                  </div>
                  <div className="text-xs text-gray-500">
                    Condition record — pallet, box or loose parts
                  </div>
                </button>
              ) : (
                <div className="relative">
                  <img
                    src={partsPic}
                    alt="Parts photo"
                    className="w-full rounded-lg border-2 border-gray-300"
                  />
                  <button
                    onClick={() => setPartsPic(null)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold hover:bg-red-700"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Collection Instructions */}
            <div className="mb-5">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                COLLECTION INSTRUCTIONS / NOTES
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special handling or collection instructions..."
                rows={3}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Job Options */}
            <div className="space-y-3 mb-5">
              {/* Urgent - Red Border */}
              <div className="border-2 border-red-300 rounded-lg p-3 bg-red-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-red-700">
                      🚨 Urgent
                    </div>
                    <div className="text-xs text-red-600">
                      Highlighted red — jumps the queue
                    </div>
                  </div>
                  <label className="relative inline-block w-12 h-6 ml-3">
                    <input
                      type="checkbox"
                      checked={urgent}
                      onChange={(e) => setUrgent(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-red-600 transition-colors cursor-pointer"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                  </label>
                </div>
              </div>

              {/* Internal TGAEP */}
              <div className="border border-gray-300 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      🏭 Internal TGAEP
                    </div>
                    <div className="text-xs text-gray-500">
                      Internal job — no invoice at dispatch
                    </div>
                  </div>
                  <label className="relative inline-block w-12 h-6 ml-3">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-primary transition-colors cursor-pointer"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                  </label>
                </div>
              </div>

              {/* Freight Requested */}
              <div className="border border-gray-300 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      Freight requested
                    </div>
                    <div className="text-xs text-gray-500">
                      Customer requested freight — cost added at dispatch
                    </div>
                  </div>
                  <label className="relative inline-block w-12 h-6 ml-3">
                    <input
                      type="checkbox"
                      checked={freightRequested}
                      onChange={(e) => setFreightRequested(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-primary transition-colors cursor-pointer"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                  </label>
                </div>
              </div>

              {/* Minimum Charge */}
              <div className="border border-gray-300 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      Minimum charge
                    </div>
                    <div className="text-xs text-gray-500">
                      Apply $60.00 minimum (Silver)
                    </div>
                  </div>
                  <label className="relative inline-block w-12 h-6 ml-3">
                    <input
                      type="checkbox"
                      checked={minCharge}
                      onChange={(e) => setMinCharge(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-primary transition-colors cursor-pointer"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                  </label>
                </div>
              </div>

              {/* Flag This Job - Orange Border */}
              <div className="border-2 border-orange-300 rounded-lg p-3 bg-orange-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-orange-700">
                      🔧 Flag this job
                    </div>
                    <div className="text-xs text-orange-600">
                      Mark for follow-up — price correction, missing Xero item,
                      etc
                    </div>
                  </div>
                  <label className="relative inline-block w-12 h-6 ml-3">
                    <input
                      type="checkbox"
                      checked={flagged}
                      onChange={(e) => setFlagged(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-orange-600 transition-colors cursor-pointer"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  resetForm();
                  setShowSheet(false);
                }}
                className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-3 text-base font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!customer && !isInternal}
                className="flex-1 bg-primary text-white rounded-lg py-3 text-base font-semibold hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Save Job
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
};
