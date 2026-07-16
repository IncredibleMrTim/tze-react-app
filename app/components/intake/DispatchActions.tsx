"use client";
import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import { useJobs, useUpdateJob, useDispatchJob } from "@/hooks/useJobs";
import {
  useJigAssignments,
  useDeleteJigAssignment,
} from "@/hooks/useJigAssignments";
import { useSettings } from "@/hooks/useSettings";
import { useIntakeStore } from "@/hooks/useIntakeStore";
import { isReady, calcPrice } from "@/lib/helpers";
import { INV_PREFIX } from "@/constants/invoice.const";
import type { IJob } from "@/types/interfaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function buildDispatchedJob(
  job: IJob,
  invoiceNumber: string,
  priceOverride: string,
  freightCost: string,
): IJob {
  return {
    ...job,
    dispatchedAt: Date.now(),
    invoiceNumber,
    fpnDownloaded: false,
    csvDownloaded: false,
    priceOverride: priceOverride ? parseFloat(priceOverride) : null,
    freightCost: parseFloat(freightCost || "0"),
  };
}

/**
 * Dispatch / undispatch actions for the job currently being edited in the
 * Enter Job sheet.
 *
 * Renders nothing when creating a new job, or when the job being edited is
 * not yet ready for dispatch. Shows a "Confirm & Dispatch" panel (with a
 * "Send back for another run" fallback) once all JIG runs are cleared, and
 * a "Remove from Dispatch" action if the job has already been dispatched.
 */
export function DispatchActions() {
  const { showToast } = useToast();
  const { editingJobId, closeSheet } = useIntakeStore();
  const { data: jobs = [] } = useJobs(10000);
  const { data: jigAssignments = [] } = useJigAssignments(5000);
  const { data: settings } = useSettings();
  const updateJobMutation = useUpdateJob();
  const dispatchJobMutation = useDispatchJob();
  const deleteAssignmentMutation = useDeleteJigAssignment();

  const [priceOverride, setPriceOverride] = useState("");
  const [freightCost, setFreightCost] = useState("0.00");

  const job = jobs.find((j) => j.id === editingJobId) ?? null;

  if (!job || !settings) return null;

  const isDispatched = !!job.dispatchedAt;
  const readyForDispatch = !isDispatched && isReady(job, jigAssignments);

  if (!isDispatched && !readyForDispatch) return null;

  const handleRemoveFromDispatch = () => {
    if (
      !window.confirm(
        `Remove ${job.po_number} from dispatch? This will move it back to Ready to Dispatch.`,
      )
    )
      return;

    updateJobMutation.mutate(
      { jobId: job.id, job: { dispatchedAt: null, invoiceNumber: null } },
      {
        onSuccess: () => {
          showToast("Job removed from dispatch — now ready to dispatch");
        },
        onError: () => showToast("Failed to remove from dispatch"),
      },
    );
  };

  const handleSendBack = () => {
    if (
      !window.confirm(
        `Send back ${job.po_number}? JIG links will be cleared. Job returns to active jobs for re-jigging.`,
      )
    )
      return;

    deleteAssignmentMutation.mutate(job.id, {
      onSuccess: () => {
        closeSheet();
        showToast(`${job.po_number} sent back for re-jigging`);
      },
      onError: () => showToast("Failed to send back job"),
    });
  };

  const handleDispatch = () => {
    const invoiceNumber =
      job.isInternal || job.isRework
        ? "INTERNAL"
        : `${INV_PREFIX}-${new Date().getFullYear()}-${String(settings.invSeq).padStart(4, "0")}`;

    const dispatchedJob = buildDispatchedJob(
      job,
      invoiceNumber,
      priceOverride,
      freightCost,
    );

    dispatchJobMutation.mutate(
      { job: dispatchedJob, invoiceNumber },
      {
        onSuccess: () => {
          closeSheet();
          showToast(`Dispatched: ${job.po_number}`);
        },
        onError: () => showToast("Failed to dispatch job"),
      },
    );
  };

  if (isDispatched) {
    return (
      <div className="mb-5 border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm font-semibold text-gray-700">
            🚚 Dispatched
          </div>
          <div className="text-xs text-gray-500">{job.invoiceNumber}</div>
        </div>
        <Button
          onClick={handleRemoveFromDispatch}
          disabled={updateJobMutation.isPending}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3"
        >
          ↩️ Remove from Dispatch
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-5 border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
      <div className="text-sm font-semibold text-blue-900 mb-3">
        ✅ Ready to dispatch
      </div>
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-gray-700">Parts total</div>
        <div className="font-bold text-lg">
          ${calcPrice(job, settings).toFixed(2)}
        </div>
      </div>
      <div className="mb-3">
        <label className="text-xs text-gray-600 mb-1 block">
          Price override ($){" "}
          <span className="text-gray-400">optional</span>
        </label>
        <Input
          type="text"
          value={priceOverride}
          onChange={(e) => setPriceOverride(e.target.value)}
          placeholder="Leave blank to use calculated"
          className="w-full"
        />
      </div>
      <div className="mb-3">
        <label className="text-xs text-gray-600 mb-1 block">
          Freight cost ($)
        </label>
        <Input
          type="number"
          value={freightCost}
          onChange={(e) => setFreightCost(e.target.value)}
          step="0.01"
          min="0"
          className="w-full"
        />
      </div>
      <Button
        onClick={handleDispatch}
        disabled={dispatchJobMutation.isPending}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 mb-2"
      >
        Confirm & Dispatch
      </Button>
      <Button
        variant="outline"
        onClick={handleSendBack}
        disabled={deleteAssignmentMutation.isPending}
        className="w-full py-3"
      >
        ↻ Send back for another run
      </Button>
    </div>
  );
}
