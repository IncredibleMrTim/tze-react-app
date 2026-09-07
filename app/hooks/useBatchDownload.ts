import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type {
  IDispatchedJobRow,
  IJob,
  IJigAssignment,
  ISettings,
} from "@/types/interfaces"
import { dl, genBatchCSV } from "@/lib/exports"
import { fetchJobById, useUpdateJob } from "@/hooks/useJobs"
import { useToast } from "@/hooks/useToast"

/**
 * Owns selection state for the dispatched-jobs download list and the batch
 * FPN/CSV export flow — fetches the full record for each selected job
 * (list rows only carry a trimmed field set) before generating files.
 *
 * Archiving is per-format: `fpnHidden`/`csvHidden` are independent flags,
 * so archiving a job from the FPN tab doesn't affect its CSV visibility
 * and vice versa. A job also drops off whichever tab (FPN/CSV) it's
 * already been downloaded for, so the two tabs can show different
 * subsets of `dispatchedJobs`.
 */
export function useBatchDownload(
  dispatchedJobs: IDispatchedJobRow[],
  settings: ISettings | undefined,
  jigAssignments: IJigAssignment[],
) {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const updateJobMutation = useUpdateJob()

  const [activeDownloadTab, setActiveDownloadTabState] = useState<
    "FPN" | "CSV"
  >("FPN")
  const [rawSelectedDownloads, setSelectedDownloads] = useState<string[]>([])

  // A job selected on one tab isn't necessarily meant for the other (it may
  // just coincidentally also be downloadable there) — start fresh on switch
  // rather than letting selection leak across formats.
  const setActiveDownloadTab = (tab: "FPN" | "CSV") => {
    setActiveDownloadTabState(tab)
    setSelectedDownloads([])
  }
  const [isDownloading, setIsDownloading] = useState(false)
  // Tracks which individual job's email button is mid-send, so only that
  // button swaps to a spinner instead of blocking the whole page.
  const [emailingJobIds, setEmailingJobIds] = useState<Set<string>>(new Set())
  const [isEmailingAll, setIsEmailingAll] = useState(false)
  const [showNoValidJobsAlert, setShowNoValidJobsAlert] = useState(false)

  // Which flags the active tab reads/writes for archive status and download
  // status — used both for filtering below and exposed so the archive/
  // unarchive actions in the UI know which field to patch.
  const hiddenField: "fpnHidden" | "csvHidden" =
    activeDownloadTab === "FPN" ? "fpnHidden" : "csvHidden"
  const downloadedField: "fpnDownloaded" | "csvDownloaded" =
    activeDownloadTab === "FPN" ? "fpnDownloaded" : "csvDownloaded"

  const downloadableJobs = useMemo(
    () => dispatchedJobs.filter((j) => !j[hiddenField] && !j[downloadedField]),
    [dispatchedJobs, hiddenField, downloadedField],
  )

  const archivedJobs = useMemo(
    () => dispatchedJobs.filter((j) => j[hiddenField]),
    [dispatchedJobs, hiddenField],
  )

  // Counted independently of activeDownloadTab so both tab labels can show
  // their own pending count at once.
  const fpnDownloadableCount = useMemo(
    () => dispatchedJobs.filter((j) => !j.fpnHidden && !j.fpnDownloaded).length,
    [dispatchedJobs],
  )
  const csvDownloadableCount = useMemo(
    () => dispatchedJobs.filter((j) => !j.csvHidden && !j.csvDownloaded).length,
    [dispatchedJobs],
  )

  // Same idea, but counting each format's archived jobs instead — shown on
  // the tab labels while the archived view is active.
  const fpnArchivedCount = useMemo(
    () => dispatchedJobs.filter((j) => j.fpnHidden).length,
    [dispatchedJobs],
  )
  const csvArchivedCount = useMemo(
    () => dispatchedJobs.filter((j) => j.csvHidden).length,
    [dispatchedJobs],
  )

  // Union, not sum — a job pending in both FPN and CSV only counts once.
  const pendingDownloadCount = useMemo(
    () =>
      dispatchedJobs.filter(
        (j) =>
          (!j.fpnHidden && !j.fpnDownloaded) ||
          (!j.csvHidden && !j.csvDownloaded),
      ).length,
    [dispatchedJobs],
  )

  // A selected job can drop out of downloadableJobs without the user doing
  // anything here — it got archived/downloaded from another tab (relayed
  // over the websocket) or by this tab's own mutation settling. Deriving
  // the selection from the current downloadableJobs, rather than trusting
  // the raw click history, keeps a stale id from riding along into the next
  // batch download/email.
  const selectedDownloads = useMemo(
    () =>
      rawSelectedDownloads.filter((id) =>
        downloadableJobs.some((job) => job.id === id),
      ),
    [rawSelectedDownloads, downloadableJobs],
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

  const clearSelection = () => setSelectedDownloads([])

  const downloadJobs = async (ids: string[]) => {
    if (!settings) return

    setIsDownloading(true)
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          queryClient.fetchQuery({
            queryKey: ["job", id],
            queryFn: () => fetchJobById(id),
            staleTime: 60000,
          }),
        ),
      )

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
        const res = await fetch("/api/fpn/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobIds: fullJobs.map((j) => j.id) }),
        })
        if (!res.ok) {
          showToast("Failed to generate FPN PDF")
          return
        }
        const blob = await res.blob()
        const dispositionMatch = res.headers
          .get("Content-Disposition")
          ?.match(/filename="([^"]+)"/)
        const filename =
          dispositionMatch?.[1] ??
          (fullJobs.length > 1
            ? `FPN-batch-${new Date().toISOString().slice(0, 10)}.zip`
            : `FPN_${fullJobs[0].po_number}.pdf`)
        dl(blob, filename)

        fullJobs.forEach((job) => {
          updateJobMutation.mutate({
            jobId: job.id,
            job: { fpnDownloaded: true },
          })
        })
        showToast(
          failedCount > 0
            ? `Downloaded ${fullJobs.length} of ${ids.length} — ${failedCount} failed to load`
            : `Downloaded ${fullJobs.length} FPN${fullJobs.length > 1 ? "s" : ""}`,
        )
      } else {
        const includedIds = genBatchCSV(fullJobs, ids, settings, jigAssignments)
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
    } finally {
      setIsDownloading(false)
    }
  }

  interface IFpnEmailResult {
    jobId: string
    po_number: string
    status: "sent" | "skipped" | "failed"
    reason?: string
  }

  const emailFpnJobs = async (ids: string[]) => {
    if (ids.length === 0) {
      showToast("No jobs with a customer email selected")
      return
    }

    try {
      const res = await fetch("/api/email/fpn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds: ids }),
      })
      if (!res.ok) {
        showToast("Failed to send FPN email")
        return
      }
      const { results }: { results: IFpnEmailResult[] } = await res.json()
      const sent = results.filter((r) => r.status === "sent").length
      const skipped = results.filter((r) => r.status === "skipped").length
      const failed = results.filter((r) => r.status === "failed").length

      const summary = [`Emailed ${sent} FPN${sent === 1 ? "" : "s"}`]
      if (skipped > 0) summary.push(`${skipped} skipped (no email on file)`)
      if (failed > 0) summary.push(`${failed} failed`)
      showToast(summary.join(" — "))

      queryClient.invalidateQueries({ queryKey: ["jobs", "dispatched"] })
    } catch (error) {
      console.error("Failed to send FPN email:", error)
      showToast("Failed to send FPN email")
    }
  }

  const handleEmailOne = async (jobId: string) => {
    setEmailingJobIds((prev) => new Set(prev).add(jobId))
    try {
      await emailFpnJobs([jobId])
    } finally {
      setEmailingJobIds((prev) => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    }
  }

  const handleEmailAll = async () => {
    const emailableIds = selectedDownloads.filter(
      (id) => dispatchedJobs.find((j) => j.id === id)?.customer_email,
    )
    setIsEmailingAll(true)
    // Also mark each selected row as emailing so its own button spins,
    // not just the "Send all" button.
    setEmailingJobIds((prev) => new Set([...prev, ...emailableIds]))
    try {
      await emailFpnJobs(emailableIds)
    } finally {
      setIsEmailingAll(false)
      setEmailingJobIds((prev) => {
        const next = new Set(prev)
        emailableIds.forEach((id) => next.delete(id))
        return next
      })
    }
  }

  const handleBatchDownload = () => {
    if (selectedDownloads.length === 0) {
      showToast("No jobs selected")
      return
    }
    downloadJobs(selectedDownloads)
  }

  const handleDownloadOne = (jobId: string) => downloadJobs([jobId])

  return {
    activeDownloadTab,
    setActiveDownloadTab,
    hiddenField,
    downloadableJobs,
    archivedJobs,
    fpnDownloadableCount,
    csvDownloadableCount,
    fpnArchivedCount,
    csvArchivedCount,
    pendingDownloadCount,
    selectedDownloads,
    toggleSelectAll,
    toggleSelectJob,
    clearSelection,
    isDownloading,
    handleBatchDownload,
    handleDownloadOne,
    emailingJobIds,
    isEmailingAll,
    handleEmailOne,
    handleEmailAll,
    showNoValidJobsAlert,
    setShowNoValidJobsAlert,
  }
}
