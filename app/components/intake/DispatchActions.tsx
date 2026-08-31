"use client";

import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import { useJobById, useUpdateJob, useDispatchJob } from "@/hooks/useJobs";
import {
  useJigAssignments,
  useDeleteJigAssignment,
} from "@/hooks/useJigAssignments";
import { useSettings } from "@/hooks/useSettings";
import { useIntakeStore } from "@/store/useIntakeStore";
import { isReady, calcPrice } from "@/lib/helpers";
import { INV_PREFIX } from "@/constants/invoice.const";
import type { IJob } from "@/types/interfaces";
import { Button } from "@/components/ui/button";
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

function buildDispatchedJob(job: IJob, invoiceNumber: string): IJob {
  return {
    ...job,
    dispatchedAt: Date.now(),
    invoiceNumber,
    fpnDownloaded: false,
    csvDownloaded: false,
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
  const { data: job = null } = useJobById(editingJobId);
  const { data: jigAssignments = [] } = useJigAssignments(5000);
  const { data: settings } = useSettings();
  const updateJobMutation = useUpdateJob();
  const dispatchJobMutation = useDispatchJob();
  const deleteAssignmentMutation = useDeleteJigAssignment();

  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showSendBackConfirm, setShowSendBackConfirm] = useState(false);

  if (!job || !settings) return null;

  const readyForDispatch = isReady(job, jigAssignments);

  if (!readyForDispatch) return null;

  const handleRemoveFromDispatch = () => {
    updateJobMutation.mutate(
      { jobId: job.id, job: { dispatchedAt: null, invoiceNumber: null } },
      {
        onSuccess: () => {
          setShowRemoveConfirm(false);
          showToast("Job removed from dispatch — now ready to dispatch");
        },
        onError: () => {
          setShowRemoveConfirm(false);
          showToast("Failed to remove from dispatch");
        },
      },
    );
  };

  const handleSendBack = () => {
    deleteAssignmentMutation.mutate(job.id, {
      onSuccess: () => {
        setShowSendBackConfirm(false);
        closeSheet();
        showToast(`${job.po_number} sent back for re-jigging`);
      },
      onError: () => {
        setShowSendBackConfirm(false);
        showToast("Failed to send back job");
      },
    });
  };

  const handleDispatch = () => {
    const invoiceNumber =
      job.isInternal || job.isRework
        ? "INTERNAL"
        : `${INV_PREFIX}-${new Date().getFullYear()}-${String(settings.invSeq).padStart(4, "0")}`;

    const dispatchedJob = buildDispatchedJob(job, invoiceNumber);

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

  return (
    <>
      <div className="mb-5 border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
        <div className="text-sm font-semibold text-blue-900 mb-3">
          ✅ Ready to dispatch
        </div>
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-gray-700">Parts total</div>
          <div className="font-bold text-lg">
            ${calcPrice(job, settings, jigAssignments).toFixed(2)}
          </div>
        </div>
        {job.priceOverride && (
          <div className="flex justify-between items-center mb-3">
            <div className="text-xs text-gray-600">Price override</div>
            <div className="font-semibold text-sm">
              ${job.priceOverrideValue.toFixed(2)}
            </div>
          </div>
        )}
        {job.freightRequested && (
          <div className="flex justify-between items-center mb-3">
            <div className="text-xs text-gray-600">Freight cost</div>
            <div className="font-semibold text-sm">
              ${job.freightCost.toFixed(2)}
            </div>
          </div>
        )}
        <Button
          onClick={handleDispatch}
          disabled={dispatchJobMutation.isPending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 mb-2"
        >
          Confirm & Dispatch
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowSendBackConfirm(true)}
          disabled={deleteAssignmentMutation.isPending}
          className="w-full py-3"
        >
          ↻ Send back for another run
        </Button>
      </div>

      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {job.po_number} from dispatch?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will move it back to Ready to Dispatch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFromDispatch}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showSendBackConfirm}
        onOpenChange={setShowSendBackConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send back {job.po_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              JIG links will be cleared. Job returns to active jobs for
              re-jigging.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={handleSendBack}
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
    </>
  );
}
