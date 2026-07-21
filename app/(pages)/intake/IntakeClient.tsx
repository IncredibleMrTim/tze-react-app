"use client";
import { FiMail, FiPhone } from "react-icons/fi";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { useJobs, useDeleteJob, useJobImages } from "@/hooks/useJobs";
import { useJigAssignments } from "@/hooks/useJigAssignments";
import { useContacts } from "@/hooks/useContacts";
import { useIntakeStore } from "@/store/useIntakeStore";
import { toBlobProxyUrl, toSignedImageUrl } from "@/lib/blob-upload";
import type { IJob } from "@/types/interfaces";
import { FiPlus } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/JobCard";
import { EnterJobSheet } from "@/components/intake/EnterJobSheet";
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
  // React Query hooks - auto-refresh for real-time updates
  const {
    data: jobs = [],
    isLoading: jobsLoading,
    error: jobsError,
  } = useJobs();
  const { data: jigAssignments = [], isLoading: jigsLoading } =
    useJigAssignments();
  const { data: CONTACTS = [], isLoading: contactsLoading } = useContacts();

  const deleteJobMutation = useDeleteJob();

  const error = jobsError;

  // Zustand store - all state
  const { currentJob, setShowSheet, setCurrentJob, openJobForEdit } =
    useIntakeStore();

  // Fetch images when viewing a job
  const { data: jobImages } = useJobImages(currentJob?.id || null);

  const isLoading = jobsLoading || jigsLoading || contactsLoading;

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

  const groupJobsByDate = useMemo(() => {
    const groups: Record<string, IJob[]> = {};
    const undispatchedJobs = jobs.filter((j) => !j.dispatchedAt);

    undispatchedJobs.forEach((j) => {
      const dateLabel = formatJobDate(j.createdAt);
      if (!groups[dateLabel]) groups[dateLabel] = [];
      groups[dateLabel].push(j);
    });

    return groups;
  }, [jobs]);

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
            {jobs.length} jobs
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

      {jobs.length === 0 && (
        <div className="text-center py-16">
          <div className="text-7xl mb-4">🏭</div>
          <div className="text-xl font-semibold text-gray-800 mb-2">
            Shop floor clear
          </div>
          <div className="text-base text-gray-500">Tap + to log a new job</div>
        </div>
      )}

      {jobs.length > 0 && !currentJob && (
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
        </div>
      )}

      {currentJob && (
        <div className="pb-20">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentJob(null)}
              className="flex items-center gap-1 text-primary font-medium text-sm"
            >
              ← Back to Jobs
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleteJobMutation.isPending}
                className="px-4 py-1.5 border-2 border-red-500 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  openJobForEdit(
                    currentJob,
                    CONTACTS.find((c) => c.name === currentJob.customer_name) ||
                      null,
                  );
                  setCurrentJob(null);
                }}
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
                    <div className="text-xs text-gray-500">{part.code}</div>
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
                    src={toSignedImageUrl(jobImages.partsOnArrivalPhotos[0])}
                    alt="Parts on arrival"
                    className="w-full rounded-lg border border-gray-200"
                  />
                ) : (
                  <Carousel className="w-full">
                    <CarouselContent>
                      {jobImages.partsOnArrivalPhotos.map((photo, index) => (
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
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </Carousel>
                )}
              </div>
            )}
          <div className="mb-4">
            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              JIG ASSIGNMENTS
            </h3>
            {jigAssignments.filter((j) => j.jobId === currentJob.id).length >
            0 ? (
              <div className="space-y-2">
                {jigAssignments
                  .filter((j) => j.jobId === currentJob.id)
                  .map((jig) => (
                    <div
                      key={jig.id}
                      className="bg-white border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-sm">
                          {jig.jigName}
                        </div>
                        <div
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            jig.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {jig.status}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {jig.pct}% of jig • Loaded{" "}
                        {new Date(jig.loadedAt).toLocaleDateString("en-NZ", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                      {jig.completedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Completed{" "}
                          {new Date(jig.completedAt).toLocaleDateString(
                            "en-NZ",
                            {
                              day: "numeric",
                              month: "short",
                            },
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                No JIG assigned yet — assign from the JIG tab when loading.
              </div>
            )}
          </div>
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
                  {new Date(currentJob.createdAt).toLocaleDateString("en-NZ", {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  {new Date(currentJob.createdAt).toLocaleTimeString("en-NZ", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

      <EnterJobSheet />
    </div>
  );
}
