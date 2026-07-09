"use client";

import { useState } from "react";
import type { IJob } from "@/types/interfaces";
import type { TPlating } from "@/types/types";
import { isReady, calcPrice } from "@/lib/helpers";
import { genFPN, genBatchCSV } from "@/lib/exports";
import { INV_PREFIX } from "@/constants/invoice.const";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Overlay } from "@/components/Overlay";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/useToast";
import { useJobs, useUpdateJob, useDispatchJob } from "@/hooks/useJobs";
import { useJigAssignments, useDeleteJigAssignment } from "@/hooks/useJigAssignments";
import { useSettings } from "@/hooks/useSettings";

export default function DispatchClient() {
  const { showToast } = useToast();

  // React Query hooks - auto-refresh every 5 seconds for real-time monitoring
  const { data: jobs = [], isLoading: jobsLoading } = useJobs(5000);
  const { data: jigAssignments = [], isLoading: jigsLoading } = useJigAssignments(5000);
  const { data: settings, isLoading: settingsLoading } = useSettings();

  // Mutation hooks
  const updateJobMutation = useUpdateJob();
  const dispatchJobMutation = useDispatchJob();
  const deleteAssignmentMutation = useDeleteJigAssignment();

  const isLoading = jobsLoading || jigsLoading || settingsLoading;
  const isPending =
    updateJobMutation.isPending ||
    dispatchJobMutation.isPending ||
    deleteAssignmentMutation.isPending;

  const [jobToSendBack, setJobToSendBack] = useState<IJob | null>(null);
  const [jobToDispatch, setJobToDispatch] = useState<IJob | null>(null);
  const [editedJob, setEditedJob] = useState<IJob | null>(null);
  const [priceOverride, setPriceOverride] = useState("");
  const [freightCost, setFreightCost] = useState("0.00");
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [activeDownloadTab, setActiveDownloadTab] = useState<"FPN" | "CSV">("FPN");
  const [selectedDownloads, setSelectedDownloads] = useState<string[]>([]);

  // Show loading state
  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <div className="text-lg text-gray-600">Loading dispatch...</div>
        </div>
      </div>
    );
  }

  const readyJobs = jobs.filter((j) => isReady(j, jigAssignments) && !j.dispatchedAt);
  const dispatchedJobs = jobs
    .filter((j) => j.dispatchedAt && !j.fpnHidden)
    .sort((a, b) => (b.dispatchedAt || 0) - (a.dispatchedAt || 0));

  const openDispatchModal = (job: IJob) => {
    setJobToDispatch(job);
    setEditedJob({ ...job });
    setPriceOverride("");
    setFreightCost("0.00");
    setShowJobDetails(false);
  };

  const applyJobChanges = () => {
    if (editedJob) {
      setJobToDispatch(editedJob);

      updateJobMutation.mutate(
        { jobId: editedJob.id, job: editedJob },
        {
          onSuccess: () => {
            setShowJobDetails(false);
            showToast("Job details updated");
          },
          onError: () => {
            showToast("Failed to update job");
          },
        }
      );
    }
  };

  const handleDispatchJob = () => {
    if (!jobToDispatch) return;

    const invoiceNumber =
      jobToDispatch.isInternal || jobToDispatch.isRework
        ? "INTERNAL"
        : `${INV_PREFIX}-${new Date().getFullYear()}-${String(settings.invSeq).padStart(4, "0")}`;

    const dispatchedJob = {
      ...jobToDispatch,
      dispatchedAt: Date.now(),
      invoiceNumber,
      fpnDownloaded: false,
      csvDownloaded: false,
    };

    dispatchJobMutation.mutate(
      { job: dispatchedJob, invoiceNumber },
      {
        onSuccess: () => {
          showToast(`Dispatched: ${jobToDispatch.po_number}`);
          setJobToDispatch(null);
        },
        onError: () => {
          showToast("Failed to dispatch job");
        },
      }
    );
  };

  const confirmSendBack = () => {
    if (!jobToSendBack) return;

    deleteAssignmentMutation.mutate(jobToSendBack.id, {
      onSuccess: () => {
        showToast(`${jobToSendBack.po_number} sent back for re-jigging`);
        setJobToSendBack(null);
      },
      onError: () => {
        showToast("Failed to send back job");
        setJobToSendBack(null);
      },
    });
  };

  const toggleSelectAll = () => {
    if (selectedDownloads.length === dispatchedJobs.length) {
      setSelectedDownloads([]);
    } else {
      setSelectedDownloads(dispatchedJobs.map((j) => j.id));
    }
  };

  const toggleSelectJob = (jobId: string) => {
    setSelectedDownloads((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const handleBatchDownload = () => {
    if (selectedDownloads.length === 0) {
      showToast("No jobs selected");
      return;
    }

    if (activeDownloadTab === "FPN") {
      selectedDownloads.forEach((jobId) => {
        const job = dispatchedJobs.find((j) => j.id === jobId);
        if (job) genFPN(job);
      });
      showToast(`Downloaded ${selectedDownloads.length} FPN${selectedDownloads.length > 1 ? "s" : ""}`);
    } else {
      genBatchCSV(jobs, selectedDownloads, settings, jigAssignments);
      showToast("Batch CSV downloaded");
    }
  };

  const handleDeleteDispatchedJob = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    if (window.confirm(`Delete ${job.po_number} from downloads?`)) {
      updateJobMutation.mutate(
        { jobId, job: { fpnHidden: true } },
        {
          onSuccess: () => {
            showToast("Job removed from downloads");
          },
          onError: () => {
            showToast("Failed to remove job");
          },
        }
      );
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Dispatch</h2>

      {readyJobs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Ready to Dispatch ({readyJobs.length})
          </h3>
          {readyJobs.map((j) => (
            <div
              key={j.id}
              onClick={() => openDispatchModal(j)}
              className="bg-white border-2 border-primary rounded-xl p-4 mb-2.5 active:bg-primary-bg cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="font-bold text-lg mb-1">{j.po_number}</div>
                  <div className="text-[15px] text-gray-700">
                    {j.customer_name}
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-sm font-medium">
                  Ready
                </span>
              </div>

              <div className="flex gap-2 mb-3">
                {j.plating && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded bg-gray-100 text-gray-700 capitalize">
                    {j.plating}
                  </span>
                )}
                {j.urgent && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded bg-red-100 text-red-800">
                    Urgent
                  </span>
                )}
                {j.isInternal && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded bg-sky-100 text-sky-800">
                    Internal
                  </span>
                )}
              </div>

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setJobToSendBack(j);
                }}
                className="w-full bg-white border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-normal hover:bg-gray-50"
                variant="outline"
                disabled={isPending}
              >
                ↻ Send back for another run
              </Button>
            </div>
          ))}
        </div>
      )}

      {readyJobs.length === 0 && (
        <EmptyState
          icon="🚚"
          title="Nothing to dispatch"
          message="Jobs appear here once all JIG runs are complete and PO is marked done"
        />
      )}

      {/* Downloads Section */}
      {dispatchedJobs.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            DOWNLOADS
          </h3>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveDownloadTab("FPN")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeDownloadTab === "FPN"
                  ? "text-emerald-600 border-b-2 border-emerald-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📄 FPN
            </button>
            <button
              onClick={() => setActiveDownloadTab("CSV")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeDownloadTab === "CSV"
                  ? "text-emerald-600 border-b-2 border-emerald-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📊 Xero CSV
            </button>
          </div>

          {/* Select All */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-t-lg border-x border-t">
            <input
              type="checkbox"
              checked={selectedDownloads.length === dispatchedJobs.length}
              onChange={toggleSelectAll}
              className="w-5 h-5 rounded border-gray-300"
            />
            <span className="font-medium text-gray-700">Select all</span>
          </div>

          {/* Job List */}
          <div className="border border-gray-200 rounded-b-lg divide-y">
            {dispatchedJobs.map((job) => (
              <div key={job.id} className="flex items-center gap-3 p-3 bg-white hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedDownloads.includes(job.id)}
                  onChange={() => toggleSelectJob(job.id)}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <div className="flex-1">
                  <div className="font-bold text-base mb-1">
                    {job.po_number}
                  </div>
                  <div className="text-sm text-gray-500">
                    {job.invoiceNumber} · {new Date(job.dispatchedAt!).toLocaleDateString("en-NZ", {
                      day: "numeric",
                      month: "short"
                    })}
                  </div>
                </div>
                {job.plating && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded capitalize">
                    {job.plating}
                  </span>
                )}
                <button
                  onClick={() => handleDeleteDispatchedJob(job.id)}
                  disabled={isPending}
                  className="px-3 py-1 border-2 border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          {/* Download Button */}
          <Button
            onClick={handleBatchDownload}
            disabled={selectedDownloads.length === 0}
            className="w-full h-14 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 mt-4"
          >
            ⬇ Download {activeDownloadTab}(s)
          </Button>

          <p className="text-center text-sm text-gray-500 mt-3">
            Dispatched jobs are in Search history
          </p>
        </div>
      )}

      <AlertDialog open={!!jobToSendBack} onOpenChange={(open) => !open && setJobToSendBack(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold">
              Send back — {jobToSendBack?.po_number}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-600">
              JIG links will be cleared. Job returns to active jobs for re-jigging.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={confirmSendBack}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-base"
            >
              ↻ Send back for another run
            </AlertDialogAction>
            <AlertDialogCancel className="w-full py-3 text-base">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dispatch Modal */}
      {jobToDispatch && (
        <Overlay onClose={() => setJobToDispatch(null)}>
          <div className="p-6">
            <div className="w-9 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">
              Dispatch — {jobToDispatch.po_number}
            </h2>

            {/* Job Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="font-bold text-xl mb-1">{jobToDispatch.po_number}</div>
              <div className="text-gray-600">{jobToDispatch.customer_name}</div>
            </div>

            {/* Parts List */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                PARTS
              </h3>
              <div className="space-y-3">
                {jobToDispatch.parts.map((part, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium">{part.desc}</div>
                      <div className="font-semibold">×{part.qty}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">{part.code}</div>
                      <div className="text-gray-700">${(part.price * part.qty).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Check & Edit Job Details - Collapsible */}
            <div className="mb-4 border-2 border-emerald-500 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowJobDetails(!showJobDetails)}
                className="w-full p-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 text-emerald-600 font-medium">
                  <span>🔗</span>
                  <span>Check & edit job details</span>
                </div>
                <span className="text-gray-400">{showJobDetails ? "▲" : "▼"}</span>
              </button>

              {showJobDetails && editedJob && (
                <div className="p-4 pt-0 border-t space-y-4">
                  {/* PO Number */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      PO number
                    </label>
                    <Input
                      type="text"
                      value={editedJob.po_number}
                      onChange={(e) =>
                        setEditedJob({ ...editedJob, po_number: e.target.value })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Contact Number */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Contact number <span className="text-gray-400">(optional)</span>
                    </label>
                    <Input
                      type="text"
                      value={editedJob.customer_contact || ""}
                      onChange={(e) =>
                        setEditedJob({ ...editedJob, customer_contact: e.target.value })
                      }
                      placeholder="e.g. 021 123 4567"
                      className="w-full"
                    />
                  </div>

                  {/* Plating */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Plating
                    </label>
                    <Input
                      type="text"
                      value={editedJob.plating || ""}
                      onChange={(e) =>
                        setEditedJob({ ...editedJob, plating: e.target.value as TPlating })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Notes
                    </label>
                    <textarea
                      value={editedJob.notes || ""}
                      onChange={(e) =>
                        setEditedJob({ ...editedJob, notes: e.target.value })
                      }
                      placeholder="Collection instructions or special notes"
                      className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Parts */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      PARTS
                    </h4>
                    <div className="space-y-4">
                      {editedJob.parts.map((part, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <div className="font-medium">{part.code}</div>
                          <div className="text-sm text-gray-600 mb-2">{part.desc}</div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">Qty</label>
                              <Input
                                type="number"
                                value={part.qty}
                                onChange={(e) => {
                                  const newParts = [...editedJob.parts];
                                  newParts[idx] = {
                                    ...part,
                                    qty: parseInt(e.target.value) || 0,
                                  };
                                  setEditedJob({ ...editedJob, parts: newParts });
                                }}
                                min="0"
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">
                                Price per part
                              </label>
                              <Input
                                type="number"
                                value={part.price}
                                onChange={(e) => {
                                  const newParts = [...editedJob.parts];
                                  newParts[idx] = {
                                    ...part,
                                    price: parseFloat(e.target.value) || 0,
                                  };
                                  setEditedJob({ ...editedJob, parts: newParts });
                                }}
                                step="0.01"
                                min="0"
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Apply Changes Button */}
                  <Button
                    onClick={applyJobChanges}
                    disabled={isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3"
                  >
                    Apply changes
                  </Button>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                PRICING
              </h3>

              {/* Parts Total */}
              <div className="bg-green-50 rounded-lg p-4 mb-3 flex justify-between items-center">
                <div className="font-medium">Parts total</div>
                <div className="font-bold text-lg">${calcPrice(jobToDispatch, settings).toFixed(2)}</div>
              </div>

              {/* Price Override */}
              <div className="mb-3">
                <label className="text-sm text-gray-600 mb-2 block">
                  Price override ($) <span className="text-gray-400">optional</span>
                </label>
                <Input
                  type="text"
                  value={priceOverride}
                  onChange={(e) => setPriceOverride(e.target.value)}
                  placeholder="Leave blank to use calculated"
                  className="w-full"
                />
              </div>

              {/* Freight Cost */}
              <div className="mb-3">
                <label className="text-sm text-gray-600 mb-2 block">
                  Freight cost ($)
                </label>
                <Input
                  type="number"
                  value={freightCost}
                  onChange={(e) => setFreightCost(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full"
                />
              </div>

              {/* Invoice Total */}
              <div className="bg-gray-100 rounded-lg p-4 flex justify-between items-center">
                <div className="font-semibold">Invoice total (incl. freight)</div>
                <div className="font-bold text-xl">
                  ${(
                    (priceOverride ? parseFloat(priceOverride) : calcPrice(jobToDispatch, settings)) +
                    parseFloat(freightCost || "0")
                  ).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <Button
              onClick={handleDispatchJob}
              disabled={isPending}
              className="w-full h-14 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 mb-3"
            >
              Confirm & Dispatch — Generate FPN + CSV
            </Button>

            <Button
              variant="outline"
              onClick={() => setJobToDispatch(null)}
              className="w-full h-12 text-base"
            >
              Cancel
            </Button>
          </div>
        </Overlay>
      )}
    </div>
  );
}
