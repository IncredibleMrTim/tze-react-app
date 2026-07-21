"use client";

import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { useJobs, useUpdateJob, useJobImages } from "@/hooks/useJobs";
import { useJigAssignments } from "@/hooks/useJigAssignments";
import { JobCard } from "@/components/JobCard";
import { EmptyState } from "@/components/EmptyState";
import { isReady, stageLabel } from "@/lib/helpers";
import { genFPN } from "@/lib/exports";
import { toBlobProxyUrl, toSignedImageUrl } from "@/lib/blob-upload";
import type { IJob } from "@/types/interfaces";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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

export default function JobsClient() {
  const { showToast } = useToast();

  // React Query hooks - auto-refresh for real-time updates
  const { data: jobs = [], isLoading: jobsLoading } = useJobs(10000);
  const { data: jigAssignments = [], isLoading: jigsLoading } =
    useJigAssignments(5000);
  const updateJobMutation = useUpdateJob();

  const isLoading = jobsLoading || jigsLoading;

  const [viewingJob, setViewingJob] = useState<IJob | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // Fetch images when viewing a job
  const { data: jobImages } = useJobImages(viewingJob?.id || null);

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateMode, setDateMode] = useState<"created" | "dispatched">("created");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleJobClickAction = (job: IJob) => {
    setViewingJob(job);
  };

  const handleDownloadFPN = () => {
    if (!viewingJob) return;
    genFPN(viewingJob);
    showToast(`Downloaded FPN for ${viewingJob.po_number}`);
  };

  const handleRemoveFromDispatch = () => {
    if (!viewingJob) return;

    updateJobMutation.mutate(
      {
        jobId: viewingJob.id,
        job: { dispatchedAt: null, invoiceNumber: null },
      },
      {
        onSuccess: () => {
          setShowRemoveConfirm(false);
          setViewingJob(null);
          showToast("Job removed from dispatch");
        },
        onError: () => {
          setShowRemoveConfirm(false);
          showToast("Failed to remove from dispatch");
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent, predictions: IJob[]) => {
    if (!showDropdown || predictions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % predictions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + predictions.length) % predictions.length,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (predictions[selectedIndex]) {
        handleJobClickAction(predictions[selectedIndex]);
        setShowDropdown(false);
        inputRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const hasActiveFilters = searchTerm || dateFrom || dateTo;

  const filtered = jobs.filter((j) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();

      // Smart search across all job fields
      const matchesPO = j.po_number.toLowerCase().includes(term);
      const matchesCustomer = j.customer_name.toLowerCase().includes(term);
      const matchesAccount = j.customer_account.toLowerCase().includes(term);
      const matchesContact = j.customer_contact.toLowerCase().includes(term);
      const matchesEmail = j.customer_email.toLowerCase().includes(term);
      const matchesInvoice = j.invoiceNumber?.toLowerCase().includes(term);
      const matchesNotes = j.notes.toLowerCase().includes(term);
      const matchesPartDesc = j.partDescription.toLowerCase().includes(term);
      const matchesParts = j.parts.some(
        (p) =>
          p.code.toLowerCase().includes(term) ||
          p.desc.toLowerCase().includes(term),
      );

      if (
        !matchesPO &&
        !matchesCustomer &&
        !matchesAccount &&
        !matchesContact &&
        !matchesEmail &&
        !matchesInvoice &&
        !matchesNotes &&
        !matchesPartDesc &&
        !matchesParts
      ) {
        return false;
      }
    }

    const dateToCheck =
      dateMode === "created" ? j.createdAt : j.dispatchedAt || 0;
    if (dateFrom && dateToCheck < new Date(dateFrom).getTime()) return false;
    if (dateTo && dateToCheck > new Date(dateTo).getTime() + 86400000)
      return false;

    return true;
  });

  // Predictive search results (top 10 matches when typing)
  const predictions = searchTerm
    ? filtered.slice(0, 10).sort((a, b) => b.createdAt - a.createdAt)
    : [];

  const dispatched = filtered.filter((j) => j.dispatchedAt);
  const ready = filtered.filter(
    (j) => isReady(j, jigAssignments) && !j.dispatchedAt,
  );
  const wip = filtered.filter(
    (j) =>
      !isReady(j, jigAssignments) &&
      !j.dispatchedAt &&
      jigAssignments.some((g) => g.jobId === j.id && g.status === "ACTIVE"),
  );
  const intake = filtered.filter(
    (j) => !j.dispatchedAt && !jigAssignments.some((g) => g.jobId === j.id),
  );

  // Show loading state on initial load
  if (isLoading) {
    return (
      <div className="relative h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <div className="text-lg text-gray-600">Loading jobs...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 relative" ref={searchRef}>
        <input
          ref={inputRef}
          type="text"
          placeholder="🔍 Search PO, customer, account, invoice, parts, notes..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(e.target.value.length > 0);
            setSelectedIndex(0);
          }}
          onFocus={() => searchTerm && setShowDropdown(true)}
          onKeyDown={(e) => handleKeyDown(e, predictions)}
          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-base outline-none focus:border-primary"
          autoComplete="off"
        />

        {/* Predictive dropdown */}
        {showDropdown && predictions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {predictions.map((job, idx) => (
              <div
                key={job.id}
                onClick={() => {
                  handleJobClickAction(job);
                  setShowDropdown(false);
                }}
                className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                  idx === selectedIndex ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-900">
                      {job.po_number}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {job.customer_name}
                      {job.invoiceNumber && (
                        <span className="ml-2 text-gray-400">
                          • {job.invoiceNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        job.dispatchedAt
                          ? "bg-green-100 text-green-700"
                          : job.poComplete
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {stageLabel(job, jigAssignments)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="dd/mm/yyyy"
          className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <span className="flex items-center text-gray-400 text-sm">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="dd/mm/yyyy"
          className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={handleClear}
          className="px-4 py-2 border-2 border-gray-200 rounded-lg text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setDateMode("created")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            dateMode === "created"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Date created
        </button>
        <button
          onClick={() => setDateMode("dispatched")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            dateMode === "dispatched"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Date dispatched
        </button>
      </div>

      {dispatched.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-2 px-0 mt-1.5">
            Dispatched ({dispatched.length})
          </div>
          {dispatched.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              jigAssignments={jigAssignments}
              onClick={() => handleJobClickAction(j)}
              showArrivalTime={true}
              showJigStatus={true}
            />
          ))}
        </div>
      )}

      {ready.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-2 px-0 mt-1.5">
            Ready to Dispatch ({ready.length})
          </div>
          {ready.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              jigAssignments={jigAssignments}
              onClick={() => handleJobClickAction(j)}
              showArrivalTime={true}
              showJigStatus={true}
            />
          ))}
        </div>
      )}

      {wip.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-2 px-0 mt-1.5">
            Work in Progress ({wip.length})
          </div>
          {wip.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              jigAssignments={jigAssignments}
              onClick={() => handleJobClickAction(j)}
              showArrivalTime={true}
              showJigStatus={true}
            />
          ))}
        </div>
      )}

      {intake.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-2 px-0 mt-1.5">
            Intake ({intake.length})
          </div>
          {intake.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              jigAssignments={jigAssignments}
              onClick={() => handleJobClickAction(j)}
              showArrivalTime={true}
              showJigStatus={true}
            />
          ))}
        </div>
      )}

      {jobs.length === 0 && searchTerm.length === 0 && (
        <EmptyState
          icon="🔍"
          title="No jobs yet"
          message="Create your first job in the New Job tab"
        />
      )}

      {jobs.length === 0 && filtered.length === 0 && hasActiveFilters && (
        <EmptyState
          icon="🤷"
          title="No results"
          message="Nothing matched your search or date range"
        />
      )}

      {jobs.length > 0 &&
        !hasActiveFilters &&
        dispatched.length === 0 &&
        ready.length === 0 &&
        wip.length === 0 &&
        intake.length === 0 && (
          <EmptyState
            icon="🔍"
            title="Search all jobs"
            message="Type a PO number, customer name, part code or description — or pick a date range above"
          />
        )}

      {/* Job Viewer */}
      <Drawer
        open={!!viewingJob}
        onOpenChange={(open) => !open && setViewingJob(null)}
      >
        <DrawerContent className="mx-auto h-[90%] max-w-[430px] rounded-t-[20px] border-none bg-white">
          {viewingJob && (
            <div className="px-4 pt-5 pb-6 flex-1 min-h-0 overflow-y-auto">
              <DrawerTitle className="text-[17px] font-bold mb-4">
                Job Details {viewingJob.dispatchedAt && "(Dispatched)"}
              </DrawerTitle>

              <div
                className={`border-2 rounded-xl p-4 mb-4 ${
                  viewingJob.dispatchedAt
                    ? "bg-green-50 border-green-300"
                    : "bg-blue-50 border-blue-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-xl">
                    {viewingJob.po_number}
                  </span>
                  {viewingJob.urgent && (
                    <span className="flex items-center gap-1 text-sm font-medium text-red-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                      URGENT
                    </span>
                  )}
                </div>
                <div className="text-base text-gray-700 mb-1">
                  {viewingJob.customer_name}
                </div>
                {viewingJob.customer_email && (
                  <div className="flex items-center gap-1.5 text-gray-600 text-sm mb-1">
                    ✉️ {viewingJob.customer_email}
                  </div>
                )}
                {viewingJob.customer_contact && (
                  <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                    📞 {viewingJob.customer_contact}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      viewingJob.dispatchedAt
                        ? "bg-green-600 text-white"
                        : viewingJob.poComplete
                          ? "bg-blue-600 text-white"
                          : "bg-gray-600 text-white"
                    }`}
                  >
                    {stageLabel(viewingJob, jigAssignments)}
                  </span>
                  <span className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs font-medium text-gray-700">
                    {viewingJob.plating === "gold" ? "Gold" : "Silver"}
                  </span>
                  {viewingJob.invoiceNumber && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Invoice: {viewingJob.invoiceNumber}
                    </span>
                  )}
                </div>
              </div>

              {viewingJob.parts.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    PARTS
                  </h3>
                  {viewingJob.parts.map((part, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 rounded-lg p-3 mb-2 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {part.desc}
                        </div>
                        <div className="text-xs text-gray-500">
                          {part.code}
                        </div>
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

              {jobImages?.poPages && jobImages.poPages.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    PO DOCUMENT{" "}
                    {jobImages.poPages.length > 1 &&
                      `(${jobImages.poPages.length} PAGES)`}
                  </h3>
                  {jobImages.poPages.length === 1 ? (
                    <img
                      src={toBlobProxyUrl(jobImages.poPages[0])}
                      alt="Purchase Order"
                      className="w-full rounded-lg border border-gray-200"
                    />
                  ) : (
                    <Carousel className="w-full">
                      <CarouselContent>
                        {jobImages.poPages.map((page, index) => (
                          <CarouselItem key={index}>
                            <div className="relative w-full border border-gray-200 rounded-lg overflow-hidden">
                              <img
                                src={toBlobProxyUrl(page)}
                                alt={`PO page ${index + 1}`}
                                className="w-full rounded-lg"
                              />
                              <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
                                Page {index + 1} of {jobImages.poPages.length}
                              </div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </Carousel>
                  )}
                </div>
              )}

              {jobImages?.partsOnArrivalPhotos &&
                jobImages.partsOnArrivalPhotos.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      PARTS ON ARRIVAL{" "}
                      {jobImages.partsOnArrivalPhotos.length > 1 &&
                        `(${jobImages.partsOnArrivalPhotos.length} PHOTOS)`}
                    </h3>
                    {jobImages.partsOnArrivalPhotos.length === 1 ? (
                      <img
                        src={toSignedImageUrl(
                          jobImages.partsOnArrivalPhotos[0],
                        )}
                        alt="Parts on arrival"
                        className="w-full rounded-lg border border-gray-200"
                      />
                    ) : (
                      <Carousel className="w-full">
                        <CarouselContent>
                          {jobImages.partsOnArrivalPhotos.map(
                            (photo, index) => (
                              <CarouselItem key={index}>
                                <div className="relative w-full border border-gray-200 rounded-lg overflow-hidden">
                                  <img
                                    src={toSignedImageUrl(photo)}
                                    alt={`Parts photo ${index + 1}`}
                                    className="w-full rounded-lg"
                                  />
                                  <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
                                    Photo {index + 1} of{" "}
                                    {jobImages.partsOnArrivalPhotos.length}
                                  </div>
                                </div>
                              </CarouselItem>
                            ),
                          )}
                        </CarouselContent>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                      </Carousel>
                    )}
                  </div>
                )}

              {viewingJob.partDescription && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    PARTS DESCRIPTION
                  </h3>
                  <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                    {viewingJob.partDescription}
                  </div>
                </div>
              )}

              {viewingJob.notes && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    NOTES
                  </h3>
                  <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                    {viewingJob.notes}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  TIMELINE
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📬</span>
                    <div>
                      <div className="font-semibold text-sm text-gray-900">
                        Arrived
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(viewingJob.createdAt).toLocaleDateString(
                          "en-NZ",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}{" "}
                        {new Date(viewingJob.createdAt).toLocaleTimeString(
                          "en-NZ",
                          {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          },
                        )}
                      </div>
                    </div>
                  </div>
                  {viewingJob.dispatchedAt && (
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🚚</span>
                      <div>
                        <div className="font-semibold text-sm text-gray-900">
                          Dispatched
                        </div>
                        <div className="text-xs text-gray-600">
                          {new Date(
                            viewingJob.dispatchedAt,
                          ).toLocaleDateString("en-NZ", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          {new Date(
                            viewingJob.dispatchedAt,
                          ).toLocaleTimeString("en-NZ", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200">
                {viewingJob.dispatchedAt && (
                  <>
                    <Button
                      onClick={handleDownloadFPN}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    >
                      📥 Download FPN
                    </Button>

                    <Button
                      onClick={() => setShowRemoveConfirm(true)}
                      disabled={updateJobMutation.isPending}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3"
                    >
                      ↩️ Remove from Dispatch
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  onClick={() => setViewingJob(null)}
                  className="w-full py-3"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {viewingJob?.po_number} from dispatch?
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
    </div>
  );
}
