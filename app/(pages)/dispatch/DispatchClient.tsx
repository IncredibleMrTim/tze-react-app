"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import type { IJob, IDispatchedJobRow } from "@/types/interfaces"
import { calcPrice, jigsOf, dateGroupLabel } from "@/lib/helpers"
import { genFPN, genBatchCSV } from "@/lib/exports"
import { INV_PREFIX } from "@/constants/invoice.const"
import { EmptyState } from "@/components/EmptyState"
import { LoadingState } from "@/components/LoadingState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/useToast"
import {
  useReadyJobs,
  useDispatchedJobs,
  useJobById,
  useUpdateJob,
  useDispatchJob,
  fetchJobById,
} from "@/hooks/useJobs"
import {
  useJigAssignments,
  useDeleteJigAssignment,
} from "@/hooks/useJigAssignments"
import { useSettings } from "@/hooks/useSettings"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { PredictiveSearchInput } from "@/components/PredictiveSearchInput"
import { JobCard } from "@/components/JobCard"
import { LuRotateCcw, LuSquareCheck, LuTrash, LuTruck } from "react-icons/lu"
import { calculateRates } from "@/constants/settings.const"

export default function DispatchClient() {
  const { showToast } = useToast()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Search terms are debounced before hitting the server so the paginated
  // queries below don't refetch on every keystroke.
  const [readySearchTerm, setReadySearchTerm] = useState("")
  const [dispatchedSearchTerm, setDispatchedSearchTerm] = useState("")
  const debouncedReadySearch = useDebouncedValue(readySearchTerm)
  const debouncedDispatchedSearch = useDebouncedValue(dispatchedSearchTerm)

  // Live updates arrive via WebSocket; hooks poll only as a backstop
  const {
    data: readyData,
    isLoading: readyLoading,
    fetchNextPage: fetchNextReadyPage,
    hasNextPage: hasNextReadyPage,
    isFetchingNextPage: isFetchingNextReadyPage,
  } = useReadyJobs(debouncedReadySearch)
  const {
    data: dispatchedData,
    isLoading: dispatchedLoading,
    fetchNextPage: fetchNextDispatchedPage,
    hasNextPage: hasNextDispatchedPage,
    isFetchingNextPage: isFetchingNextDispatchedPage,
  } = useDispatchedJobs(debouncedDispatchedSearch)
  const { data: jigAssignments = [], isLoading: jigsLoading } =
    useJigAssignments()
  const { data: settings, isLoading: settingsLoading } = useSettings()

  // Mutation hooks
  const updateJobMutation = useUpdateJob()
  const dispatchJobMutation = useDispatchJob()
  const deleteAssignmentMutation = useDeleteJigAssignment()

  const isLoading =
    readyLoading || dispatchedLoading || jigsLoading || settingsLoading
  const isPending =
    updateJobMutation.isPending ||
    dispatchJobMutation.isPending ||
    deleteAssignmentMutation.isPending

  const [activeTab, setActiveTab] = useState<"ready" | "downloads">("ready")
  const [jobToSendBack, setJobToSendBack] = useState<IJob | null>(null)
  const [jobToDelete, setJobToDelete] = useState<IDispatchedJobRow | null>(null)
  const [showNoValidJobsAlert, setShowNoValidJobsAlert] = useState(false)
  const [jobToDispatch, setJobToDispatch] = useState<IJob | null>(null)
  const [priceOverride, setPriceOverride] = useState("")
  const [freightCost, setFreightCost] = useState("0.00")
  const [activeDownloadTab, setActiveDownloadTab] = useState<"FPN" | "CSV">(
    "FPN",
  )
  const [selectedDownloads, setSelectedDownloads] = useState<string[]>([])
  const [isDownloading, setIsDownloading] = useState(false)

  // Full job detail (parts, pricing fields) for whichever job is open in
  // the dispatch modal — the ready-list rows only carry the trimmed
  // JobCard field set, same lazy-load pattern as intake's job drawer.
  const { data: fullJobToDispatch } = useJobById(jobToDispatch?.id ?? null)

  const readyJobs = useMemo(
    () => readyData?.pages.flatMap((p) => p.jobs) ?? [],
    [readyData],
  )
  const readyTotalCount = readyData?.pages[0]?.totalCount ?? readyJobs.length

  const dispatchedJobs = useMemo(
    () => dispatchedData?.pages.flatMap((p) => p.jobs) ?? [],
    [dispatchedData],
  )

  // Date-grouped headers (TODAY/YESTERDAY/date), same as intake's on-floor
  // list — ready jobs group by arrival date, dispatched jobs by the date
  // they were sent out.
  const readyJobsByDate = useMemo(() => {
    const groups: Record<string, IJob[]> = {}
    readyJobs.forEach((j) => {
      const dateLabel = dateGroupLabel(j.createdAt)
      if (!groups[dateLabel]) groups[dateLabel] = []
      groups[dateLabel].push(j)
    })
    return groups
  }, [readyJobs])

  const dispatchedJobsByDate = useMemo(() => {
    const groups: Record<string, IDispatchedJobRow[]> = {}
    dispatchedJobs.forEach((j) => {
      const dateLabel = dateGroupLabel(j.dispatchedAt)
      if (!groups[dateLabel]) groups[dateLabel] = []
      groups[dateLabel].push(j)
    })
    return groups
  }, [dispatchedJobs])

  // The title/tabs/search block is `position: fixed` (not `sticky`) so job
  // cards can never render above it — sticky positioning inside a padded
  // `overflow-y-auto` container is prone to a 1px render seam where scrolled
  // content peeks through at the boundary. Fixed elements are composited
  // independently of scroll, so there's no seam to leak through. Since fixed
  // elements don't occupy flow space, the scrollable content below is given
  // matching top padding measured from the fixed block's real height.
  const fixedHeaderRef = useRef<HTMLDivElement>(null)
  const [fixedHeaderHeight, setFixedHeaderHeight] = useState(0)

  useEffect(() => {
    const node = fixedHeaderRef.current
    if (!node) return

    const updateHeight = () => setFixedHeaderHeight(node.offsetHeight)
    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(node)
    return () => observer.disconnect()
    // isLoading is included because the ref only attaches once the loading
    // branch below stops short-circuiting the render — without it, this
    // effect's first (and only, since activeTab hasn't changed) run sees
    // fixedHeaderRef.current as null and never retries once the real DOM
    // node exists.
  }, [activeTab, isLoading])

  // Infinite scroll: fetch the next page once the sentinel at the bottom
  // of each list comes into view.
  const loadMoreReadyRef = useRef<HTMLDivElement>(null)
  const loadMoreDispatchedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = loadMoreReadyRef.current
    if (!node || !hasNextReadyPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextReadyPage) {
          fetchNextReadyPage()
        }
      },
      { rootMargin: "200px" },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextReadyPage, isFetchingNextReadyPage, fetchNextReadyPage])

  useEffect(() => {
    const node = loadMoreDispatchedRef.current
    if (!node || !hasNextDispatchedPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextDispatchedPage) {
          fetchNextDispatchedPage()
        }
      },
      { rootMargin: "200px" },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [
    hasNextDispatchedPage,
    isFetchingNextDispatchedPage,
    fetchNextDispatchedPage,
  ])

  // Show loading state
  if (isLoading || !settings) {
    return <LoadingState message="Loading dispatch..." />
  }

  const rates = calculateRates(settings)

  const openDispatchModal = (job: IJob) => {
    setJobToDispatch(job)
    setPriceOverride("")
    setFreightCost("0.00")
  }

  const handleEditInIntake = (job: IJob) => {
    router.push(`/intake?referer=dispatch&jobId=${job.id}`)
  }

  const handleDispatchJob = () => {
    if (!fullJobToDispatch) return

    const invoiceNumber =
      fullJobToDispatch.isInternal || fullJobToDispatch.isRework
        ? "INTERNAL"
        : `${INV_PREFIX}-${new Date().getFullYear()}-${String(settings.invSeq).padStart(4, "0")}`

    const dispatchedJob: IJob = {
      ...fullJobToDispatch,
      dispatchedAt: Date.now(),
      invoiceNumber,
      fpnDownloaded: false,
      csvDownloaded: false,
      priceOverride: priceOverride ? parseFloat(priceOverride) : null,
      freightCost: parseFloat(freightCost || "0"),
    }

    dispatchJobMutation.mutate(
      { job: dispatchedJob, invoiceNumber },
      {
        onSuccess: () => {
          showToast(`Dispatched: ${fullJobToDispatch.po_number}`)
          setJobToDispatch(null)
        },
        onError: () => {
          showToast("Failed to dispatch job")
        },
      },
    )
  }

  const handleBackToDispatch = (job: { id: string }) => {
    updateJobMutation.mutate(
      { jobId: job.id, job: { dispatchedAt: null, invoiceNumber: null } },
      {
        onSuccess: () => {
          showToast("Job removed from dispatch — now ready to dispatch")
        },
        onError: () => showToast("Failed to remove from dispatch"),
      },
    )
  }

  const confirmSendBack = () => {
    if (!jobToSendBack) return

    deleteAssignmentMutation.mutate(jobToSendBack.id, {
      onSuccess: () => {
        showToast(`${jobToSendBack.po_number} sent back for re-jigging`)
        setJobToSendBack(null)
      },
      onError: () => {
        showToast("Failed to send back job")
        setJobToSendBack(null)
      },
    })
  }

  const toggleSelectAll = () => {
    if (selectedDownloads.length === dispatchedJobs.length) {
      setSelectedDownloads([])
    } else {
      setSelectedDownloads(dispatchedJobs.map((j) => j.id))
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
      fullJobs.forEach((job) => genFPN(job))
      showToast(
        failedCount > 0
          ? `Downloaded ${fullJobs.length} of ${selectedDownloads.length} — ${failedCount} failed to load`
          : `Downloaded ${fullJobs.length} FPN${fullJobs.length > 1 ? "s" : ""}`,
      )
    } else {
      const generated = genBatchCSV(
        fullJobs,
        selectedDownloads,
        settings,
        jigAssignments,
      )
      if (!generated) {
        setShowNoValidJobsAlert(true)
        return
      }
      showToast(
        failedCount > 0
          ? `Batch CSV downloaded — ${failedCount} job(s) failed to load and were excluded`
          : "Batch CSV downloaded",
      )
    }
  }

  const handleDeleteDispatchedJob = (jobId: string) => {
    const job = dispatchedJobs.find((j) => j.id === jobId)
    if (!job) return

    setJobToDelete(job)
  }

  const confirmDeleteDispatchedJob = () => {
    if (!jobToDelete) return

    updateJobMutation.mutate(
      { jobId: jobToDelete.id, job: { fpnHidden: true } },
      {
        onSuccess: () => {
          setJobToDelete(null)
          showToast("Job removed from downloads")
        },
        onError: () => {
          setJobToDelete(null)
          showToast("Failed to remove job")
        },
      },
    )
  }

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "ready" | "downloads")}
        className="w-full"
      >
        <div
          ref={fixedHeaderRef}
          className="fixed top-12 left-1/2 z-40 w-full -translate-x-1/2 bg-white px-3 pb-4 pt-4 md:max-w-[430px] border-b"
        >
          <h2 className="text-lg font-bold mb-4">Dispatch</h2>
          <TabsList className="w-full grid grid-cols-2 mb-3">
            <TabsTrigger value="ready">
              Ready to Dispatch ({readyTotalCount})
            </TabsTrigger>
            <TabsTrigger value="downloads">Dispatched</TabsTrigger>
          </TabsList>

          {activeTab === "ready" ? (
            <PredictiveSearchInput
              value={readySearchTerm}
              onChange={setReadySearchTerm}
              placeholder="🔍 Search PO, customer..."
              predictions={readyJobs.slice(0, 10)}
              onSelect={openDispatchModal}
              renderMeta={(job) => (
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    job.plating === "gold"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {job.plating === "gold" ? "Gold" : "Silver"}
                </span>
              )}
            />
          ) : (
            <PredictiveSearchInput
              value={dispatchedSearchTerm}
              onChange={setDispatchedSearchTerm}
              placeholder="🔍 Search PO, customer, invoice..."
              predictions={dispatchedJobs.slice(0, 10)}
              onSelect={(job) => toggleSelectJob(job.id)}
              renderMeta={(job) => (
                <span className="text-xs text-gray-500">
                  {job.invoiceNumber}
                </span>
              )}
            />
          )}
        </div>

        <div style={{ paddingTop: fixedHeaderHeight }}>
          <TabsContent value="ready" className="mt-2">
            {readyJobs.length === 0 && !readySearchTerm && (
              <EmptyState
                icon="🚚"
                title="Nothing to dispatch"
                message="Jobs appear here once all JIG runs are complete and PO is marked done"
              />
            )}

            {readyJobs.length === 0 && readySearchTerm && (
              <EmptyState
                icon="🤷"
                title="No results"
                message="Nothing matched your search"
              />
            )}

            {readyJobs.length > 0 && (
              <div className="">
                {Object.entries(readyJobsByDate).map(
                  ([dateLabel, dateJobs]) => (
                    <div key={dateLabel} className="mb-4">
                      <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {dateLabel}
                      </div>
                      {dateJobs.map((j) => (
                        <JobCard
                          key={j.id}
                          job={j}
                          jigAssignments={jigAssignments}
                          onClick={() => openDispatchModal(j)}
                          isDispatch
                          onSendBack={() => setJobToSendBack(j)}
                          isPending={isPending}
                        />
                      ))}
                    </div>
                  ),
                )}
                {hasNextReadyPage && (
                  <div
                    ref={loadMoreReadyRef}
                    className="py-4 text-center text-sm text-gray-400"
                  >
                    {isFetchingNextReadyPage ? "Loading more…" : ""}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="downloads" className="mt-0">
            {dispatchedJobs.length === 0 ? (
              <EmptyState
                icon="📭"
                title={
                  dispatchedSearchTerm ? "No results" : "Nothing downloaded yet"
                }
                message={
                  dispatchedSearchTerm
                    ? "Nothing matched your search"
                    : "Dispatched jobs appear here once they're sent out"
                }
              />
            ) : (
              <>
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
                  {Object.entries(dispatchedJobsByDate).map(
                    ([dateLabel, dateJobs]) => (
                      <div key={dateLabel}>
                        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 bg-gray-50">
                          {dateLabel}
                        </div>
                        <div className="divide-y">
                          {dateJobs.map((job) => (
                            <div className="flex flex-col p-3" key={job.id}>
                              <div className="flex items-center gap-3 pb-3 bg-white hover:bg-gray-50">
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
                                    {job.invoiceNumber} ·{" "}
                                    {new Date(
                                      job.dispatchedAt,
                                    ).toLocaleDateString("en-NZ", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-row gap-3 justify-between">
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => handleBackToDispatch(job)}
                                >
                                  <LuRotateCcw />
                                  Back to Dispatch
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleDeleteDispatchedJob(job.id)
                                  }
                                  disabled={isPending}
                                  className="border-red-300 text-red-600 w-full hover:bg-red-500"
                                  variant="outline"
                                >
                                  <LuTrash />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>

                {hasNextDispatchedPage && (
                  <div
                    ref={loadMoreDispatchedRef}
                    className="py-4 text-center text-sm text-gray-400"
                  >
                    {isFetchingNextDispatchedPage ? "Loading more…" : ""}
                  </div>
                )}

                {/* Download Button */}
                <Button
                  onClick={handleBatchDownload}
                  disabled={selectedDownloads.length === 0 || isDownloading}
                  className="w-full h-14 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 mt-4"
                >
                  ⬇{" "}
                  {isDownloading
                    ? "Preparing…"
                    : `Download ${activeDownloadTab}(s)`}
                </Button>

                <p className="text-center text-sm text-gray-500 mt-3">
                  Dispatched jobs are in Search history
                </p>
              </>
            )}
          </TabsContent>
        </div>
      </Tabs>

      <AlertDialog
        open={!!jobToSendBack}
        onOpenChange={(open) => !open && setJobToSendBack(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold">
              Send back — {jobToSendBack?.po_number}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-600">
              JIG links will be cleared. Job returns to active jobs for
              re-jigging.
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

      <AlertDialog
        open={!!jobToDelete}
        onOpenChange={(open) => !open && setJobToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {jobToDelete?.po_number} from downloads?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDispatchedJob}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showNoValidJobsAlert}
        onOpenChange={setShowNoValidJobsAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>No valid jobs selected</AlertDialogTitle>
            <AlertDialogDescription>
              Internal and rework jobs can&apos;t be included in a batch CSV
              export.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowNoValidJobsAlert(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dispatch Modal */}
      {jobToDispatch && (
        <Drawer open onOpenChange={(open) => !open && setJobToDispatch(null)}>
          <DrawerContent className="mx-auto h-[90%] md:max-w-[430px] rounded-t-[20px] border-none bg-white ">
            <div className="p-6 flex-1 min-h-0 overflow-y-auto">
              <DrawerTitle className="text-2xl font-bold mb-4">
                Dispatch — {jobToDispatch.po_number}
              </DrawerTitle>

              {/* Job Info */}
              <JobCard
                job={jobToDispatch}
                jigAssignments={jigAssignments}
                onClick={() => {}}
              />

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="font-bold text-xl mb-1">
                  {jobToDispatch.po_number}
                </div>
                <div className="text-gray-600">
                  {jobToDispatch.customer_name}
                </div>
              </div>

              {fullJobToDispatch ? (
                <>
                  {/* Parts List */}
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      PARTS
                    </h3>
                    <div className="space-y-3">
                      {fullJobToDispatch.parts.map((part, idx) => (
                        <div
                          key={idx}
                          className="bg-white border border-gray-200 rounded-lg p-3"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-medium">{part.desc}</div>
                            <div className="font-semibold">×{part.qty}</div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                              {part.code}
                            </div>
                            <div className="text-gray-700">
                              ${(part.price * part.qty).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      PRICING
                    </h3>

                    {/* Job Parts */}
                    <div className="border rounded-lg mb-4">
                      {/* Job Weight */}
                      <div className="border-b p-4 flex justify-between items-center">
                        <div className="">{`Weight (${fullJobToDispatch.weightKg}kg x $${rates[fullJobToDispatch.plating].kg})`}</div>
                        <div className="">
                          $
                          {(
                            (fullJobToDispatch.weightKg || 0) *
                            rates[fullJobToDispatch.plating].kg
                          ).toFixed(2)}
                        </div>
                      </div>

                      {/* Job Jig Assignments */}
                      <div className="border-b p-4 flex justify-between items-center">
                        <div className="">{`Space (${jigsOf(
                          fullJobToDispatch.id,
                          jigAssignments,
                        )
                          .map((j) => `${j.pct}%`)
                          .join(
                            " + ",
                          )} of Jig x $${rates[fullJobToDispatch.plating].jig})`}</div>
                        <div className="">
                          $
                          {(
                            (jigsOf(
                              fullJobToDispatch.id,
                              jigAssignments,
                            ).reduce((sum, j) => sum + j.pct, 0) /
                              100) *
                            rates[fullJobToDispatch.plating].jig
                          ).toFixed(2)}
                        </div>
                      </div>

                      {/* Job Strings */}
                      <div className="rounded-lg p-4 flex justify-between items-center">
                        <div className="">{`Strings (${fullJobToDispatch.stringCount} x $${settings.stringRate})`}</div>
                        <div className="">
                          $
                          {(
                            (fullJobToDispatch.stringCount || 0) *
                            (settings.stringRate || 25)
                          ).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Price Override */}
                    <div className="mb-3">
                      <label className="text-sm text-gray-600 mb-2 block">
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
                      <div className="font-semibold">
                        Invoice total (incl. freight)
                      </div>
                      <div className="font-bold text-xl">
                        $
                        {(
                          (priceOverride
                            ? parseFloat(priceOverride)
                            : calcPrice(
                                fullJobToDispatch,
                                settings,
                                jigAssignments,
                              )) + parseFloat(freightCost || "0")
                        ).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <LoadingState
                  message="Loading pricing details..."
                  className="py-8 text-center mb-4"
                />
              )}

              {/* Action Buttons */}
              <Button
                variant="outline"
                onClick={() => handleEditInIntake(jobToDispatch)}
                className="w-full h-14 text-base font-semibold rounded-lg bg-emerald-50 border-2 border-dashed border-emerald-400 text-gray-600 hover:bg-emerald-100 mb-3 [&_svg]:size-5"
              >
                <LuSquareCheck /> Check & edit job details
              </Button>

              <Button
                onClick={handleDispatchJob}
                disabled={isPending || !fullJobToDispatch}
                className="w-full h-14 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 mb-3 [&_svg]:size-5"
              >
                <LuTruck />
                Confirm & Dispatch
              </Button>

              <Button
                variant="outline"
                onClick={() => setJobToDispatch(null)}
                className="w-full h-12 text-base"
              >
                Cancel
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
