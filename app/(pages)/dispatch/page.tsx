"use client";

import { useStore } from "@/store/useStore";
import type { IJob } from "@/types/interfaces";
import { isReady, calcPrice } from "@/lib/helpers";
import { genFPN, genCSV } from "@/lib/exports";
import { INV_PREFIX } from "@/constants/invoice.const";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";

export default function DispatchPage() {
  const jobs = useStore((state) => state.jobs);
  const jigA = useStore((state) => state.jigA);
  const settings = useStore((state) => state.settings);
  const invSeq = useStore((state) => state.invSeq);
  const handleDispatch = useStore((state) => state.handleDispatch);
  const showToast = useStore((state) => state.showToast);

  const readyJobs = jobs.filter((j) => isReady(j, jigA) && !j.dispatchedAt);
  const dispatchedJobs = jobs
    .filter((j) => j.dispatchedAt && !j.fpnHidden)
    .sort((a, b) => (b.dispatchedAt || 0) - (a.dispatchedAt || 0));

  const handleDispatchJob = (job: IJob) => {
    const invoiceNumber =
      job.isInternal || job.isRework
        ? "INTERNAL"
        : `${INV_PREFIX}-${new Date().getFullYear()}-${String(invSeq).padStart(4, "0")}`;

    const dispatchedJob = {
      ...job,
      dispatchedAt: Date.now(),
      invoiceNumber,
      fpnDownloaded: false,
      csvDownloaded: false,
    };

    handleDispatch(dispatchedJob, invoiceNumber);

    genFPN(dispatchedJob);

    if (!job.isInternal && !job.isRework) {
      genCSV(dispatchedJob, settings);
    }

    showToast(`Dispatched: ${job.po_number}`);
  };

  const handleDownloadFPN = (job: IJob) => {
    genFPN(job);
    showToast("FPN downloaded");
  };

  const handleDownloadCSV = (job: IJob) => {
    if (job.isInternal || job.isRework) {
      showToast("Internal jobs do not generate CSV");
      return;
    }
    genCSV(job, settings);
    showToast("CSV downloaded");
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
              className="bg-white border-2 border-primary rounded-xl p-3.5 mb-2.5 active:bg-primary-bg"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold text-base">{j.po_number}</div>
                  <div className="text-[13px] text-gray-600">
                    {j.customer_name}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  ${calcPrice(j, settings).toFixed(2)}
                </div>
              </div>

              <div className="flex gap-1.5 flex-wrap mb-2">
                {j.plating === "gold" && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-800">
                    Gold
                  </span>
                )}
                {j.urgent && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                    Urgent
                  </span>
                )}
                {j.isInternal && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                    Internal
                  </span>
                )}
              </div>

              <Button
                onClick={() => handleDispatchJob(j)}
                className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-semibold"
                variant="outline"
              >
                🚚 Dispatch & Generate Invoice
              </Button>
            </div>
          ))}
        </div>
      )}

      {dispatchedJobs.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Recently Dispatched ({dispatchedJobs.length})
          </h3>
          {dispatchedJobs.map((j) => (
            <div
              key={j.id}
              className="bg-white border border-gray-200 rounded-xl p-3.5 mb-2.5"
            >
              <div className="flex justify-between items-start mb-1">
                <div>
                  <div className="font-bold text-sm">{j.po_number}</div>
                  <div className="text-xs text-gray-600">{j.customer_name}</div>
                </div>
                <div className="text-xs text-gray-500">
                  Invoice: {j.invoiceNumber}
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-2">
                {new Date(j.dispatchedAt!).toLocaleDateString("en-NZ")}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadFPN(j)}
                  className="flex-1 bg-blue-50 border border-blue-300 text-blue-700 rounded-lg py-1.5 text-xs font-medium"
                >
                  📄 FPN
                </button>
                {!j.isInternal && !j.isRework && (
                  <button
                    onClick={() => handleDownloadCSV(j)}
                    className="flex-1 bg-green-50 border border-green-300 text-green-700 rounded-lg py-1.5 text-xs font-medium"
                  >
                    📊 CSV
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {readyJobs.length === 0 && dispatchedJobs.length === 0 && (
        <EmptyState
          icon="🚚"
          title="No jobs to dispatch"
          message="Complete jobs in the JIG tab to make them ready"
        />
      )}
    </div>
  );
}
