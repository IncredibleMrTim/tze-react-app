"use client";
import { FiMail, FiPhone } from "react-icons/fi";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import {
  useJobs,
  useOnFloorJobs,
  useDeleteJob,
  useJobImages,
} from "@/hooks/useJobs";
import { useJigAssignments } from "@/hooks/useJigAssignments";
import { useContacts } from "@/hooks/useContacts";
import { useIntakeStore } from "@/store/useIntakeStore";
import { useVisualViewport } from "@/hooks/useVisualViewport";
import { toBlobProxyUrl, toSignedImageUrl } from "@/lib/blob-upload";
import type { IJob } from "@/types/interfaces";
import { FiPlus } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/JobCard";
import { JobSearch } from "@/components/JobSearch";
import { LoadingState } from "@/components/LoadingState";
import { EnterJobForm } from "@/components/intake/EnterJobForm";
import { JigAssignmentsSection } from "@/components/intake/JigAssignmentsSection";

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
export default function IntakeClient() {
  const { showToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Coming from the dispatch page's "Check & edit job details" button —
  // open that job straight into edit mode once jobs/contacts have loaded.
  const searchParams = useSearchParams();
  const jobIdParam = searchParams.get("jobId");
  const refererParam = searchParams.get("referer");

  // React Query hooks - auto-refresh for real-time updates

  // Primary list: jobs still on the shop floor, paginated in pages of 10.
  const {
    data: onFloorData,
    isLoading: onFloorLoading,
    error: onFloorError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useOnFloorJobs();

  // Full job history — only needed for search and the dispatch deep-link
  // below, so it's fetched lazily instead of on every intake page load.
  const {
    data: jobs = [],
    isLoading: jobsLoading,
    error: jobsError,
  } = useJobs(undefined, isSearchActive || !!jobIdParam);
  const { data: jigAssignments = [], isLoading: jigsLoading } =
    useJigAssignments();
  const { data: CONTACTS = [], isLoading: contactsLoading } = useContacts();
  const deleteJobMutation = useDeleteJob();

  const error = onFloorError || jobsError;

  // Zustand store - all state
  const {
    currentJob,
    showSheet,
    setShowSheet,
    setCurrentJob,
    openJobForEdit,
    closeSheet,
  } = useIntakeStore();

  useEffect(() => {
    if (!jobIdParam || refererParam !== "dispatch") return;
    if (jobsLoading || contactsLoading) return;

    const job = jobs.find((j) => j.id === jobIdParam);
    if (!job) return;

    const contact = CONTACTS.find((c) => c.name === job.customer_name) || null;
    openJobForEdit(job, contact, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobIdParam, refererParam, jobsLoading, contactsLoading]);

  // Fetch images when viewing a job
  const { data: jobImages } = useJobImages(currentJob?.id || null);

  const isLoading = onFloorLoading || jigsLoading || contactsLoading;

  const isJobDrawerOpen = !!currentJob || showSheet;

  // Position against the true visible area (window.visualViewport) instead
  // of vaul's own keyboard compensation, which doesn't reliably keep the
  // drawer above the on-screen keyboard on iOS Safari.
  const visualViewport = useVisualViewport();
  const drawerStyle = visualViewport
    ? {
        top: `${visualViewport.offsetTop + visualViewport.height * 0.1}px`,
        height: `${visualViewport.height * 0.9}px`,
        bottom: "auto",
      }
    : undefined;

  const confirmDeleteJob = () => {
    if (!currentJob) return;

    deleteJobMutation.mutate(currentJob.id, {
      onSuccess: () => {
        setCurrentJob(null);
        setShowDeleteConfirm(false);
        showToast("Job deleted");
      },
      onError: (error: Error) => {
        console.error("Delete job error:", error);
        const message = error?.message || "Unknown error";
        setShowDeleteConfirm(false);
        showToast(`Failed to delete job: ${message}`);
      },
    });
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

  // Jobs still on the shop floor — excludes anything dispatched or already
  // queued for dispatch. Those stages remain reachable via search. The
  // status filter itself is applied server-side (getOnFloorJobs); this
  // just flattens whatever pages have been loaded so far.
  const onFloorJobs = useMemo(
    () => onFloorData?.pages.flatMap((p) => p.jobs) ?? [],
    [onFloorData],
  );
  const onFloorTotalCount = onFloorData?.pages[0]?.totalCount ?? onFloorJobs.length;

  const groupJobsByDate = useMemo(() => {
    const groups: Record<string, IJob[]> = {};

    onFloorJobs.forEach((j) => {
      const dateLabel = formatJobDate(j.createdAt);
      if (!groups[dateLabel]) groups[dateLabel] = [];
      groups[dateLabel].push(j);
    });

    return groups;
  }, [onFloorJobs]);

  // Infinite scroll: fetch the next page of on-floor jobs once the sentinel
  // at the bottom of the list comes into view.
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage || isSearchActive) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isSearchActive, fetchNextPage]);

  // Show loading state on initial load
  if (isLoading) {
    return (
      <LoadingState
        message="Loading jobs..."
        className="relative h-full flex items-center justify-center"
      />
    );
  }

  // Show error state if query failed
  if (error) {
    return (
      <div className="relative h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <div className="text-lg text-red-600">Failed to load jobs</div>
          <div className="text-sm text-gray-500 mt-2">
            {(error as Error).message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="text-base text-gray-600">
          On floor:{" "}
          <span className="font-semibold text-gray-900">
            {onFloorTotalCount} jobs
          </span>
        </div>
        <Button
          onClick={() => setShowSheet(true)}
          size="icon"
          className="w-8 h-8 rounded-full shadow-sm shadow-gray-400 border-black text-white"
          aria-label="Add new job"
        >
          <FiPlus size="20" />
        </Button>
      </div>

      <div className="mb-4">
        <JobSearch
          jobs={jobs}
          jigAssignments={jigAssignments}
          onSelectJob={setCurrentJob}
          onActiveChange={setIsSearchActive}
        />
      </div>

      {onFloorJobs.length === 0 && !isSearchActive && (
        <div className="text-center py-16">
          <div className="text-7xl mb-4">🏭</div>
          <div className="text-xl font-semibold text-gray-800 mb-2">
            Shop floor clear
          </div>
          <div className="text-base text-gray-500">Tap + to log a new job</div>
        </div>
      )}

      {onFloorJobs.length > 0 && !isSearchActive && (
        <div className="space-y-4">
          {Object.entries(groupJobsByDate).map(([dateLabel, dateJobs]) => (
            <div key={dateLabel}>
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {dateLabel}
              </div>
              {dateJobs.map((j) => (
                <JobCard
                  key={j.id}
                  job={j}
                  jigAssignments={jigAssignments}
                  onClick={() => setCurrentJob(j)}
                  showArrivalTime={true}
                  showJigStatus={true}
                />
              ))}
            </div>
          ))}
          {hasNextPage && (
            <div ref={loadMoreRef} className="py-4 text-center text-sm text-gray-400">
              {isFetchingNextPage ? "Loading more…" : ""}
            </div>
          )}
        </div>
      )}

      <Drawer
        open={isJobDrawerOpen}
        onOpenChange={(open) => !open && closeSheet()}
        repositionInputs={false}
      >
        <DrawerContent
          className="mx-auto mt-0 h-[90%] md:max-w-[430px] rounded-t-[20px] border-none bg-white"
          style={drawerStyle}
        >
          <div className="px-4 pt-5 pb-6 flex-1 min-h-0 overflow-y-auto">
            {showSheet ? (
              <EnterJobForm />
            ) : (
              currentJob && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <DrawerTitle className="text-[17px] font-bold">
                      Job Details
                    </DrawerTitle>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={deleteJobMutation.isPending}
                        className="px-4 py-1.5 border-2 border-red-500 text-red-600 rounded-lg text-base font-medium hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() =>
                          openJobForEdit(
                            currentJob,
                            CONTACTS.find(
                              (c) => c.name === currentJob.customer_name,
                            ) || null,
                          )
                        }
                        className="px-4 py-1.5 border-2 border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary-bg"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  <JobCard
                    job={currentJob}
                    jigAssignments={jigAssignments}
                    onClick={() => {}}
                    showJigStatus={true}
                  />
                  <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">
                    CONTACT
                  </h3>
                  <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-md mb-4">
                    <span className="flex items-center gap-2">
                      <FiMail />
                      {currentJob.customer_email ? (
                        <a
                          href={`mailto: ${currentJob.customer_email}`}
                          className="underline"
                        >
                          {currentJob.customer_email}
                        </a>
                      ) : (
                        "No Provided"
                      )}
                    </span>
                    <span className="flex items-center gap-2">
                      <FiPhone />
                      {currentJob.customer_contact || "Not Provided"}
                    </span>
                  </div>
                  {currentJob.parts.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        PARTS
                      </h3>
                      {currentJob.parts.map((part, idx) => (
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
                          alt="PO Document"
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
                                    alt={`PO Page ${index + 1}`}
                                    className="w-full rounded-lg"
                                  />
                                  <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
                                    Page {index + 1} of{" "}
                                    {jobImages.poPages.length}
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
                                        Part {index + 1} of{" "}
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

                  <JigAssignmentsSection jobId={currentJob.id} />
                  {currentJob.partDescription && (
                    <div className="mb-4">
                      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        PARTS DESCRIPTION
                      </h3>
                      <div className="text-sm text-gray-700">
                        {currentJob.partDescription}
                      </div>
                    </div>
                  )}
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
                          {new Date(currentJob.createdAt).toLocaleDateString(
                            "en-NZ",
                            {
                              day: "numeric",
                              month: "short",
                            },
                          )}{" "}
                          {new Date(currentJob.createdAt).toLocaleTimeString(
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
                  </div>
                </>
              )
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete job {currentJob?.po_number}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteJob}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
