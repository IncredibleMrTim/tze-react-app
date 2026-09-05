"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { IJob, IDispatchedJobRow } from "@/types/interfaces"
import { groupByDate } from "@/lib/helpers"
import { INV_PREFIX } from "@/constants/invoice.const"
import { EmptyState } from "@/components/EmptyState"
import { LoadingState } from "@/components/LoadingState"
import { Button } from "@/components/ui/button"
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
} from "@/hooks/useJobs"
import {
  useJigAssignments,
  useDeleteJigAssignment,
} from "@/hooks/useJigAssignments"
import { useSettings } from "@/hooks/useSettings"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { useMeasuredHeight } from "@/hooks/useMeasuredHeight"
import { useBatchDownload } from "@/hooks/useBatchDownload"
import { usePricingBreakdown } from "@/hooks/usePricingBreakdown"
import { PredictiveSearchInput } from "@/components/PredictiveSearchInput"
import { JobCard } from "@/components/JobCard"
import { LuRotateCcw, LuSquareCheck, LuTrash, LuTruck } from "react-icons/lu"

export default function DispatchClient() {
  const { showToast } = useToast()
  const router = useRouter()

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
  const [jobToDispatch, setJobToDispatch] = useState<IJob | null>(null)

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
  const readyJobsByDate = useMemo(
    () => groupByDate(readyJobs, (j) => j.createdAt),
    [readyJobs],
  )

  // The title/tabs/search block is `position: fixed` (not `sticky`) so job
  // cards can never render above it — sticky positioning inside a padded
  // `overflow-y-auto` container is prone to a 1px render seam where scrolled
  // content peeks through at the boundary. Fixed elements are composited
  // independently of scroll, so there's no seam to leak through. Since fixed
  // elements don't occupy flow space, the scrollable content below is given
  // matching top padding measured from the fixed block's real height.
  // isLoading is included in the deps because the ref only attaches once the
  // loading branch below stops short-circuiting the render.
  const [fixedHeaderRef, fixedHeaderHeight] = useMeasuredHeight<HTMLDivElement>(
    [activeTab, isLoading],
  )

  // Infinite scroll: fetch the next page once the sentinel at the bottom
  // of each list comes into view.
  const setLoadMoreReadyNode = useInfiniteScroll(
    hasNextReadyPage,
    isFetchingNextReadyPage,
    fetchNextReadyPage,
  )
  const setLoadMoreDispatchedNode = useInfiniteScroll(
    hasNextDispatchedPage,
    isFetchingNextDispatchedPage,
    fetchNextDispatchedPage,
  )

  const {
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
  } = useBatchDownload(dispatchedJobs, settings, jigAssignments)

  const downloadableJobsByDate = useMemo(
    () => groupByDate(downloadableJobs, (j) => j.dispatchedAt),
    [downloadableJobs],
  )

  const pricing = usePricingBreakdown(fullJobToDispatch, settings, jigAssignments)

  // Show loading state
  if (isLoading || !settings) {
    return <LoadingState message="Loading dispatch..." />
  }

  const openDispatchModal = (job: IJob) => {
    setJobToDispatch(job)
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

  const updateJob = (
    jobId: string,
    patch: Partial<IJob>,
    message?: string,
    errorMessage?: string,
    onSettled?: () => void,
  ) => {
    updateJobMutation.mutate(
      { jobId, job: patch },
      {
        onSuccess: () => {
          showToast(message ?? "Job updated successfully")
          onSettled?.()
        },
        onError: (e) => {
          showToast(errorMessage ?? `Error updating job: ${e.message}`)
          onSettled?.()
        },
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

  const handleDeleteDispatchedJob = (jobId: string) => {
    const job = dispatchedJobs.find((j) => j.id === jobId)
    if (!job) return

    setJobToDelete(job)
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
            <TabsTrigger value="downloads">
              Dispatched ({pendingDownloadCount})
            </TabsTrigger>
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
                    ref={setLoadMoreReadyNode}
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
                    📄 FPN ({fpnDownloadableCount})
                  </button>
                  <button
                    onClick={() => setActiveDownloadTab("CSV")}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      activeDownloadTab === "CSV"
                        ? "text-emerald-600 border-b-2 border-emerald-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    📊 Xero CSV ({csvDownloadableCount})
                  </button>
                </div>

                {/* Select All */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-t-lg border-x border-t">
                  <input
                    type="checkbox"
                    checked={selectedDownloads.length === downloadableJobs.length}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="font-medium text-gray-700">Select all</span>
                </div>

                {/* Job List */}
                <div className="border border-gray-200 rounded-b-lg divide-y">
                  {Object.entries(downloadableJobsByDate).map(
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
                                  onClick={() =>
                                    updateJob(
                                      job.id,
                                      { dispatchedAt: null, invoiceNumber: null },
                                      "Job removed from dispatch — now ready to dispatch",
                                      "Failed to remove from dispatch",
                                    )
                                  }
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
                    ref={setLoadMoreDispatchedNode}
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
              onClick={() =>
                jobToDelete &&
                updateJob(
                  jobToDelete.id,
                  { fpnHidden: true },
                  "Job removed from downloads",
                  "Failed to remove job",
                  () => setJobToDelete(null),
                )
              }
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

              {fullJobToDispatch && pricing ? (
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

                            <div
                              className={`text-gray-700 ${fullJobToDispatch.priceOverride && parseFloat((part.price * part.qty).toFixed(2)) > 0 ? "line-through" : ""}`}
                            >
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
                        <div className="">{`Weight (${fullJobToDispatch.weightKg}kg x $${pricing.rate.kg})`}</div>
                        <div
                          className={`${fullJobToDispatch.priceOverride && fullJobToDispatch.weightKg > 0 ? "line-through" : ""}`}
                        >
                          ${pricing.weightCost.toFixed(2)}
                        </div>
                      </div>

                      {/* Job Jig Assignments */}
                      <div className="border-b p-4 flex justify-between items-center">
                        <div>{`Space (${pricing.jigLabel} of Jig x $${pricing.rate.jig})`}</div>
                        <div
                          className={`${fullJobToDispatch.priceOverride ? "line-through" : ""}`}
                        >
                          ${pricing.jigCost.toFixed(2)}
                        </div>
                      </div>

                      {/* Job Strings */}
                      <div className="border-b p-4 flex justify-between items-center">
                        <div className="">{`Strings (${fullJobToDispatch.stringCount} x $${settings.stringRate})`}</div>
                        <div
                          className={`${fullJobToDispatch.priceOverride && fullJobToDispatch.stringCount > 0 ? "line-through" : ""}`}
                        >
                          ${pricing.stringCost.toFixed(2)}
                        </div>
                      </div>

                      {/* Freight Cost — set at intake, read-only here */}
                      {fullJobToDispatch.freightRequested && (
                        <div className="rounded-lg p-4 flex justify-between items-center">
                          <div className="">Freight cost</div>
                          <div
                            className={`${fullJobToDispatch.priceOverride && fullJobToDispatch.freightCost > 0 ? "line-through" : ""}`}
                          >
                            ${fullJobToDispatch.freightCost.toFixed(2)}
                          </div>
                        </div>
                      )}

                      {/* Price Override — set at intake, read-only here */}
                      {fullJobToDispatch.priceOverride && (
                        <div className="rounded-lg p-4 flex justify-between items-center text-red-600">
                          <div className="">Price override</div>
                          <div className="">
                            ${fullJobToDispatch.priceOverrideValue.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Invoice Total */}
                    <div className="bg-gray-100 rounded-lg p-4 flex justify-between items-center">
                      <div className="font-semibold">
                        Invoice total (incl. freight)
                      </div>
                      <div className="font-bold text-xl">
                        ${pricing.invoiceTotal.toFixed(2)}
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
