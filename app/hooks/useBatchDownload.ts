import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type {
  IDispatchedJobRow,
  IJob,
  IJigAssignment,
  ISettings,
} from "@/types/interfaces"
import { genFPN, genBatchCSV } from "@/lib/exports"
import { fetchJobById, useUpdateJob } from "@/hooks/useJobs"
import { useToast } from "@/hooks/useToast"

/**
 * Owns selection state for the dispatched-jobs download list and the batch
 * FPN/CSV export flow — fetches the full record for each selected job
 * (list rows only carry a trimmed field set) before generating files.
 *
 * A job drops off whichever tab (FPN/CSV) it's already been downloaded for,
 * so the two tabs can show different subsets of `dispatchedJobs`.
 */
export function useBatchDownload(
  dispatchedJobs: IDispatchedJobRow[],
  settings: ISettings | undefined,
  jigAssignments: IJigAssignment[],
) {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const updateJobMutation = useUpdateJob()

  const [activeDownloadTab, setActiveDownloadTab] = useState<"FPN" | "CSV">(
    "FPN",
  )
  const [selectedDownloads, setSelectedDownloads] = useState<string[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const [showNoValidJobsAlert, setShowNoValidJobsAlert] = useState(false)

  const downloadableJobs = useMemo(
    () =>
      dispatchedJobs.filter((j) =>
        activeDownloadTab === "FPN" ? !j.fpnDownloaded : !j.csvDownloaded,
      ),
    [dispatchedJobs, activeDownloadTab],
  )

  // Counted independently of activeDownloadTab so both tab labels can show
  // their own pending count at once.
  const fpnDownloadableCount = useMemo(
    () => dispatchedJobs.filter((j) => !j.fpnDownloaded).length,
    [dispatchedJobs],
  )
  const csvDownloadableCount = useMemo(
    () => dispatchedJobs.filter((j) => !j.csvDownloaded).length,
    [dispatchedJobs],
  )

  // Union, not sum — a job pending in both FPN and CSV only counts once.
  const pendingDownloadCount = useMemo(
    () => dispatchedJobs.filter((j) => !j.fpnDownloaded || !j.csvDownloaded).length,
    [dispatchedJobs],
  )

  const toggleSelectAll = () => {
    if (selectedDownloads.length === downloadableJobs.length) {
      setSelectedDownloads([])
    } else {
      setSelectedDownloads(downloadableJobs.map((j) => j.id))
    }
  }

  const toggleSelectJob = (jobId: string) => {
    setSelectedDownloads((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId],
    )
  }

  const handleBatchDownload = async () => {
    if (selectedDownloads.length === 0) {
      showToast("No jobs selected")
      return
    }
    if (!settings) return

    setIsDownloading(true)
    const results = await Promise.allSettled(
      selectedDownloads.map((id) =>
        queryClient.fetchQuery({
          queryKey: ["job", id],
          queryFn: () => fetchJobById(id),
          staleTime: 60000,
        }),
      ),
    )
    setIsDownloading(false)

    const fullJobs = results
      .filter(
        (r): r is PromiseFulfilledResult<IJob> => r.status === "fulfilled",
      )
      .map((r) => r.value)
    const failedCount = results.length - fullJobs.length

    if (fullJobs.length === 0) {
      showToast("Failed to load selected jobs")
      return
    }

    if (activeDownloadTab === "FPN") {
      fullJobs.forEach((job) => {
        genFPN(job)
        updateJobMutation.mutate({
          jobId: job.id,
          job: { fpnDownloaded: true },
        })
      })
      showToast(
        failedCount > 0
          ? `Downloaded ${fullJobs.length} of ${selectedDownloads.length} — ${failedCount} failed to load`
          : `Downloaded ${fullJobs.length} FPN${fullJobs.length > 1 ? "s" : ""}`,
      )
    } else {
      const includedIds = genBatchCSV(
        fullJobs,
        selectedDownloads,
        settings,
        jigAssignments,
      )
      if (!includedIds) {
        setShowNoValidJobsAlert(true)
        return
      }
      includedIds.forEach((jobId) =>
        updateJobMutation.mutate({ jobId, job: { csvDownloaded: true } }),
      )
      showToast(
        failedCount > 0
          ? `Batch CSV downloaded — ${failedCount} job(s) failed to load and were excluded`
          : "Batch CSV downloaded",
      )
    }
  }

  return {
    activeDownloadTab,
    setActiveDownloadTab,
    downloadableJobs,
    fpnDownloadableCount,
    csvDownloadableCount,
    pendingDownloadCount,
    selectedDownloads,
    toggleSelectAll,
    toggleSelectJob,
    isDownloading,
    handleBatchDownload,
    showNoValidJobsAlert,
    setShowNoValidJobsAlert,
  }
}
