"use client";
import { HiOutlineCamera, HiOutlineSparkles } from "react-icons/hi";
import { FiMail, FiPhone } from "react-icons/fi";
import { useRef, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import {
  useJobs,
  useCreateJob,
  useUpdateJob,
  useDeleteJob,
  useJobImages,
} from "@/hooks/useJobs";
import { useJigAssignments } from "@/hooks/useJigAssignments";
import { useItems } from "@/hooks/useItems";
import { useContacts } from "@/hooks/useContacts";
import { useIntakeStore } from "@/hooks/useIntakeStore";
import type { IJob, IItem } from "@/types/interfaces";
import { Overlay } from "@/components/Overlay";
import { fixOrientation } from "@/lib/helpers";
import type { ScanPOResponse } from "@/api/scan-po/route";
import {
  compressImage,
  PO_COMPRESSION,
  PARTS_COMPRESSION,
  getImageSizeKB,
} from "@/lib/image-compression";
import { FiPlus } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { JobCard } from "@/components/JobCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function IntakeClient() {
  const { showToast } = useToast();

  // React Query hooks - auto-refresh for real-time updates
  const {
    data: jobs = [],
    isLoading: jobsLoading,
    error: jobsError,
  } = useJobs(10000);
  const { data: jigAssignments = [], isLoading: jigsLoading } =
    useJigAssignments(5000);
  const { data: CONTACTS = [], isLoading: contactsLoading } = useContacts();

  const createJobMutation = useCreateJob();
  const updateJobMutation = useUpdateJob();
  const deleteJobMutation = useDeleteJob();

  const error = jobsError;

  // Zustand store - all state
  const {
    showSheet,
    currentJob,
    editingJobId,
    setShowSheet,
    setCurrentJob,
    setEditingJobId,
    closeSheet,
    customer,
    customerInput,
    showCustomerDropdown,
    po_number,
    contactNumber,
    partsDescription,
    parts,
    plating,
    notes,
    urgent,
    isInternal,
    flagged,
    stringsRequired,
    stringCount,
    requiresWeighing,
    freightRequested,
    minCharge,
    poPages,
    partsOnArrivalPhotos,
    scanning,
    scanResult,
    scanData,
    showRawData,
    partSearchIndex,
    partSearchTerm,
    setCustomer,
    setCustomerInput,
    setShowCustomerDropdown,
    setPoNumber,
    setContactNumber,
    setPartsDescription,
    setParts,
    setPlating,
    setNotes,
    setUrgent,
    setIsInternal,
    setFlagged,
    setStringsRequired,
    setStringCount,
    setRequiresWeighing,
    setFreightRequested,
    setMinCharge,
    setPoPages,
    addPoPages,
    removePoPage,
    setPartsOnArrivalPhotos,
    addPartsPhotos,
    removePartsPhoto,
    setScanning,
    setShowRawData,
    applyScanResult,
    setScanError,
    setPartSearchIndex,
    setPartSearchTerm,
    updatePart,
    addPart,
    removePart,
  } = useIntakeStore();

  // Fetch images when viewing a job
  const { data: jobImages } = useJobImages(currentJob?.id || null);

  const { data: ITEMS = [], isLoading: itemsLoading } = useItems(
    customer?.account ?? "",
  );
  const isLoading =
    jobsLoading || jigsLoading || itemsLoading || contactsLoading;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const partsPhotoInputRef = useRef<HTMLInputElement>(null);

  // Clear form state when navigating away from this page
  useEffect(() => {
    return () => {
      closeSheet();
    };
  }, [closeSheet]);

  const filteredCustomers = useMemo(
    () =>
      CONTACTS.filter(
        (c) =>
          c.name.toLowerCase().includes(customerInput.toLowerCase()) ||
          c.account.toLowerCase().includes(customerInput.toLowerCase()),
      ),
    [CONTACTS, customerInput],
  );

  // Add pages to staging area (don't scan yet)
  const handleAddPages = async (files: FileList) => {
    try {
      const newPages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file size before processing
        const fileSizeMB = file.size / (1024 * 1024);
        console.log(`Loading PO page ${i + 1}: ${fileSizeMB.toFixed(1)}MB`);

        if (fileSizeMB > 20) {
          showToast(
            `Image ${i + 1} too large (${fileSizeMB.toFixed(1)}MB). Max 20MB.`,
          );
          continue;
        }

        // Load and fix orientation
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            fixOrientation(result, resolve);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Compress for PO scanning (readable by Claude AI)
        const compressed = await compressImage(dataUrl, PO_COMPRESSION);
        const sizeKB = Math.round(getImageSizeKB(compressed));
        console.log(`PO page ${i + 1} compressed to ${sizeKB}KB`);

        newPages.push(compressed);
      }

      if (newPages.length === 0) {
        showToast("No images could be processed");
        return;
      }

      addPoPages(newPages);
      showToast(`${newPages.length} page(s) added`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      showToast(`Failed to load images: ${errorMessage}`);
      console.error("Error loading images:", error);
    }
  };

  // Trigger actual scan of all staged pages
  const handleScanAllPages = async () => {
    if (poPages.length === 0) return;

    setScanning(true);

    try {
      // Extract base64 data from all pages
      const base64DataArray = poPages.map((dataUrl) => dataUrl.split(",")[1]);

      // Call API route to scan all pages
      const response = await fetch("/api/scan-po", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ base64DataArray }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Scan failed");
      }

      const result: ScanPOResponse = await response.json();

      // Apply all scan results at once (includes setting scanning: false)
      applyScanResult(result);
      showToast("PO scanned successfully");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setScanError(errorMessage);
      showToast("Scan failed: " + errorMessage);
    }
  };

  // Add parts photos to array
  const handleAddPartsPhotos = async (files: FileList) => {
    try {
      const newPhotos: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file size before processing
        const fileSizeMB = file.size / (1024 * 1024);
        console.log(`Loading parts photo ${i + 1}: ${fileSizeMB.toFixed(1)}MB`);

        if (fileSizeMB > 20) {
          showToast(
            `Image ${i + 1} too large (${fileSizeMB.toFixed(1)}MB). Max 20MB.`,
          );
          continue;
        }

        // Load and fix orientation
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            fixOrientation(result, resolve);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Compress for mobile viewing
        const compressed = await compressImage(dataUrl, PARTS_COMPRESSION);
        const sizeKB = Math.round(getImageSizeKB(compressed));
        console.log(`Parts photo ${i + 1} compressed to ${sizeKB}KB`);

        newPhotos.push(compressed);
      }

      if (newPhotos.length === 0) {
        showToast("No images could be processed");
        return;
      }

      addPartsPhotos(newPhotos);
      showToast(`${newPhotos.length} photo(s) added`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      showToast(`Failed to load images: ${errorMessage}`);
      console.error("Error loading images:", error);
    }
  };

  const handleSave = () => {
    if (!customer && !isInternal) {
      showToast("Please select a customer");
      return;
    }

    if (!po_number.trim()) {
      showToast("Please enter a PO number");
      return;
    }

    if (!editingJobId && jobs.some((j) => j.po_number === po_number)) {
      showToast("PO number already exists");
      return;
    }

    // Validate data size to prevent mobile issues
    const totalImages = [...poPages, ...partsOnArrivalPhotos];
    const estimatedSizeMB = totalImages.reduce((total, img) => {
      return total + (img.length * 0.75) / (1024 * 1024); // base64 to bytes to MB
    }, 0);

    if (estimatedSizeMB > 10) {
      showToast(
        `Images too large (${estimatedSizeMB.toFixed(1)}MB). Please use fewer photos.`,
      );
      return;
    }

    console.log(
      `Job data size: ${estimatedSizeMB.toFixed(2)}MB, ${totalImages.length} images`,
    );

    if (editingJobId) {
      const existingJob = jobs.find((j) => j.id === editingJobId);
      if (!existingJob) return;

      const updatedJob: Partial<IJob> = {
        po_number,
        customer_name: customer?.name || "Internal",
        customer_account: customer?.account || "",
        customer_email: customer?.email || "",
        customer_contact: contactNumber,
        parts,
        plating,
        stringCount,
        stringsRequired,
        requiresWeighing,
        freightRequested,
        minCharge,
        flagged,
        notes,
        poPages,
        partsOnArrivalPhotos,
        urgent,
        isInternal,
        partDescription: partsDescription,
      };

      // Use React Query mutation with optimistic updates
      updateJobMutation.mutate(
        { jobId: editingJobId, job: updatedJob },
        {
          onSuccess: () => {
            handleResetForm();
            setShowSheet(false);
            showToast("Job updated: " + po_number);
          },
          onError: (error: Error) => {
            console.error("Update job error:", error);
            const message = error?.message || "Unknown error";
            showToast(`Failed to update job: ${message}`);
          },
        },
      );
    } else {
      const now = Date.now();
      // Generate unique ID with random suffix to prevent collisions
      const randomSuffix = Math.random().toString(36).substring(2, 9);
      const jobId = `${now}-${randomSuffix}`;

      const job: IJob = {
        id: jobId,
        po_number,
        customer_name: customer?.name || "Internal",
        customer_account: customer?.account || "",
        customer_email: customer?.email || "",
        customer_contact: contactNumber,
        parts,
        plating,
        weightKg: 0,
        stringCount,
        stringsRequired,
        requiresWeighing,
        freightRequested,
        minCharge,
        flagged,
        notes,
        poPages,
        partsOnArrivalPhotos,
        manualPO: false,
        urgent,
        isInternal,
        isRework: false,
        partDescription: partsDescription,
        createdAt: now,
        priceOverride: null,
        freightCost: 0,
        dispatchedAt: null,
        invoiceNumber: null,
        poComplete: false,
        fpnDownloaded: false,
        fpnHidden: false,
        csvDownloaded: false,
      };

      // Use React Query mutation with optimistic updates
      createJobMutation.mutate(job, {
        onSuccess: () => {
          handleResetForm();
          setShowSheet(false);
          showToast("Job created: " + po_number);
        },
        onError: (error: Error) => {
          console.error("Create job error:", error);
          const message = error?.message || "Unknown error";
          showToast(`Failed to create job: ${message}`);
        },
      });
    }
  };

  const handleResetForm = () => {
    closeSheet();
  };

  const handlePartCodeChange = (index: number, value: string) => {
    updatePart(index, "code", value);
    setPartSearchIndex(index);
    setPartSearchTerm(value);
  };

  const selectItem = (index: number, item: IItem) => {
    updatePart(index, "code", item.code);
    updatePart(index, "desc", item.desc);
    updatePart(index, "price", item.price);
    setPartSearchIndex(null);
    setPartSearchTerm("");
  };

  /**
   * Filter items based on search term and customer restrictions
   *
   * Returns items that match the search term (in code or description) AND are
   * allowed for the selected customer. For internal jobs, all items are allowed.
   * Requires minimum 2 characters to search.
   *
   * @returns Filtered array of items matching search criteria
   */
  const getFilteredItems = useMemo(() => {
    if (!partSearchTerm || partSearchTerm.length < 2) return [];

    const term = partSearchTerm.toLowerCase();
    return ITEMS.filter((item) => {
      const matchesTerm =
        item.code.toLowerCase().includes(term) ||
        item.desc.toLowerCase().includes(term);

      const matchesCustomer =
        !customer || isInternal || item.customer === customer.account;

      return matchesTerm && matchesCustomer;
    });
  }, [partSearchTerm, ITEMS, customer, isInternal]);

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

    undispatchedJobs.forEach((job) => {
      const dateLabel = formatJobDate(job.createdAt);
      if (!groups[dateLabel]) groups[dateLabel] = [];
      groups[dateLabel].push(job);
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
              {dateJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  jigAssignments={jigAssignments}
                  onClick={() => setCurrentJob(job)}
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
                onClick={() => {
                  if (window.confirm(`Delete job ${currentJob.po_number}?`)) {
                    deleteJobMutation.mutate(currentJob.id, {
                      onSuccess: () => {
                        setCurrentJob(null);
                        showToast("Job deleted");
                      },
                      onError: (error: Error) => {
                        console.error("Delete job error:", error);
                        const message = error?.message || "Unknown error";
                        showToast(`Failed to delete job: ${message}`);
                      },
                    });
                  }
                }}
                disabled={deleteJobMutation.isPending}
                className="px-4 py-1.5 border-2 border-red-500 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setEditingJobId(currentJob.id);
                  setCustomer(
                    CONTACTS.find((c) => c.name === currentJob.customer_name) ||
                      null,
                  );
                  setCustomerInput(currentJob.customer_name);
                  setPoNumber(currentJob.po_number);
                  setContactNumber(currentJob.customer_contact || "");
                  setPartsDescription(currentJob.partDescription || "");
                  setParts(currentJob.parts);
                  setPlating(currentJob.plating);
                  setNotes(currentJob.notes);
                  setUrgent(currentJob.urgent);
                  setIsInternal(currentJob.isInternal);
                  setFlagged(currentJob.flagged);
                  setStringsRequired(currentJob.stringsRequired);
                  setStringCount(currentJob.stringCount);
                  setRequiresWeighing(currentJob.requiresWeighing);
                  setFreightRequested(currentJob.freightRequested);
                  setMinCharge(currentJob.minCharge);
                  setPoPages(jobImages?.poPages || []);
                  setPartsOnArrivalPhotos(
                    jobImages?.partsOnArrivalPhotos || [],
                  );
                  setCurrentJob(null);
                  setShowSheet(true);
                  showToast("Editing job");
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
                  src={jobImages.poPages[0]}
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
                            src={page}
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
                    src={jobImages.partsOnArrivalPhotos[0]}
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
                              src={photo}
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

      {showSheet && (
        <Overlay onClose={closeSheet}>
          <div className="px-4 pt-5">
            <div className="w-9 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <h2 className="text-[17px] font-bold mb-4">Enter Job</h2>

            <div className="mb-5">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                SCAN PO —{" "}
                <span className="font-normal normal-case text-gray-400">
                  Claude auto-fills the form
                </span>
              </label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    handleAddPages(files);
                    // Reset input so same file can be selected again
                    e.target.value = "";
                  }
                }}
              />
              {poPages.length > 0 ? (
                <div className="space-y-3">
                  {/* Carousel for PO pages */}
                  {poPages.length === 1 ? (
                    // Single image - no carousel needed
                    <div className="relative w-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={poPages[0]}
                        alt="PO Page"
                        className="w-full rounded-lg"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                        Page 1 of 1
                      </div>
                      <button
                        onClick={() => removePoPage(0)}
                        disabled={scanning}
                        className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold hover:bg-red-600 disabled:opacity-50 shadow-lg"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    // Multiple images - use carousel
                    <Carousel className="w-full">
                      <CarouselContent>
                        {poPages.map((page, index) => (
                          <CarouselItem key={index}>
                            <div className="relative w-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                              <img
                                src={page}
                                alt={`PO Page ${index + 1}`}
                                className="w-full rounded-lg"
                                loading="lazy"
                              />
                              <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                                Page {index + 1} of {poPages.length}
                              </div>
                              <button
                                onClick={() => removePoPage(index)}
                                disabled={scanning}
                                className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold hover:bg-red-600 disabled:opacity-50 shadow-lg"
                              >
                                ×
                              </button>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </Carousel>
                  )}

                  {/* Action buttons - always visible */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={scanning}
                      className="w-full border border-dashed border-teal-500 bg-emerald-50 rounded-lg py-3 text-gray-600 text-sm font-medium hover:bg-teal-50 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <HiOutlineCamera />
                      Add page
                    </Button>
                    <Button
                      onClick={handleScanAllPages}
                      disabled={scanning}
                      className="w-full py-3 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <HiOutlineSparkles />
                      {scanning
                        ? "Scanning..."
                        : scanResult
                          ? "Rescan PO"
                          : "Scan PO"}
                    </Button>
                  </div>

                  {/* Scan result display */}
                  {scanResult && (
                    <div
                      className={`text-sm px-3 py-3 rounded-lg border ${
                        scanResult.startsWith("✓")
                          ? "bg-green-50 text-green-800 border-green-200"
                          : "bg-red-50 text-red-800 border-red-200"
                      }`}
                    >
                      {scanResult.startsWith("✓") ? (
                        <div>
                          {scanResult.split("\n").map((line, i) => (
                            <div
                              key={i}
                              className={
                                i === 0 ? "font-semibold mb-1" : "text-sm"
                              }
                            >
                              {line}
                            </div>
                          ))}
                          {scanData && (
                            <div className="mt-3 pt-3 border-t border-green-200">
                              <button
                                onClick={() => setShowRawData(!showRawData)}
                                className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 font-medium"
                              >
                                <span>{showRawData ? "▼" : "▶"}</span>
                                Show raw scan data
                              </button>
                              {showRawData && (
                                <pre className="mt-2 text-xs bg-white/50 rounded p-2 overflow-x-auto text-gray-700 font-mono">
                                  {JSON.stringify(scanData, null, 2)}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        scanResult
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={scanning}
                  className="w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg py-8 text-gray-500 text-sm disabled:opacity-50 flex flex-col items-center gap-2"
                >
                  <div className="text-3xl">📷</div>
                  <div className="font-medium text-gray-700">
                    {scanning ? "Scanning..." : "Tap to photograph PO"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Add multiple pages one at a time · Claude reads customer, PO
                    number & parts
                  </div>
                </button>
              )}
            </div>

            <div className="mb-5">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                CUSTOMER
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={customerInput}
                  onChange={(e) => {
                    setCustomerInput(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Search customer..."
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-3 text-base outline-none focus:border-primary"
                />
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 border-t-0 rounded-b-lg max-h-[200px] overflow-y-auto z-[500] shadow-lg">
                    {filteredCustomers.map((c) => (
                      <div
                        key={c.account}
                        onClick={() => {
                          setCustomer(c);
                          setCustomerInput(c.name);
                          setShowCustomerDropdown(false);
                        }}
                        className="px-3 py-3 cursor-pointer border-b border-gray-100 hover:bg-green-50 active:bg-primary-bg"
                      >
                        <div className="text-[15px]">{c.name}</div>
                        <div className="text-[12px] text-gray-500">
                          {c.account}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {customer && (
                <div className="text-[12px] text-emerald-900 mt-2 px-2 py-1.5 bg-primary-bg rounded">
                  ✓ {customer.name} ({customer.account})
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
                PO number{" "}
                <span className="text-gray-400 font-normal text-xs">
                  (leave blank to auto-assign)
                </span>
              </label>
              <Input
                type="text"
                value={po_number}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="Customer PO number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base outline-none focus:border-primary"
              />
            </div>

            <div className="mb-4">
              <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
                Contact number{" "}
                <span className="text-gray-400 font-normal text-xs">
                  (optional)
                </span>
              </label>
              <Input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. 021 123 4567"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base outline-none focus:border-primary"
              />
            </div>

            <div className="mb-5">
              <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
                Parts description{" "}
                <span className="text-gray-400 font-normal text-xs">
                  (optional — shows on job card)
                </span>
              </label>
              <Input
                type="text"
                value={partsDescription}
                onChange={(e) => setPartsDescription(e.target.value)}
                placeholder="e.g. roller pins x50, swing arms"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base outline-none focus:border-primary"
              />
            </div>

            <div className="mb-5">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                PLATING
              </label>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPlating("silver")}
                  className={`flex-1 py-2.5 border rounded-lg text-sm font-medium ${
                    plating === "silver"
                      ? "border-gray-400 bg-white text-gray-900"
                      : "border-gray-300 text-gray-500 bg-gray-50"
                  }`}
                >
                  Silver (zinc bright)
                </Button>
                <Button
                  onClick={() => setPlating("gold")}
                  className={`flex-1 py-2.5 border rounded-lg text-sm font-medium ${
                    plating === "gold"
                      ? "border-gray-400 bg-white text-gray-900"
                      : "border-gray-300 text-gray-500 bg-gray-50"
                  }`}
                >
                  Gold (zinc yellow)
                </Button>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                JIG RATE OPTIONS —{" "}
                <span className="font-normal normal-case text-gray-400">
                  fill in if no part prices on PO
                </span>
              </label>

              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <label
                      className="text-sm font-medium text-gray-900"
                      htmlFor="string-required"
                    >
                      Strings required
                    </label>
                    <div className="text-xs text-gray-500">
                      JIG cannot complete until string count is entered
                    </div>
                  </div>

                  <Switch
                    id="string-required"
                    checked={stringsRequired}
                    onCheckedChange={setStringsRequired}
                    aria-label="Toggle strings required"
                  />
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      Requires weighing
                    </div>
                    <div className="text-xs text-gray-500">
                      Dispatch blocked until weight is entered
                    </div>
                  </div>
                  <Switch
                    checked={requiresWeighing}
                    onCheckedChange={setRequiresWeighing}
                    className="ml-3"
                    aria-label="Toggle requires weighing"
                  />
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                PARTS ({parts.length}/15)
              </label>

              {!customer && !isInternal && (
                <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-lg border border-gray-200">
                  Select a customer first
                </div>
              )}

              {(customer || isInternal) && (
                <div>
                  {parts.map((part, i) => (
                    <div
                      key={i}
                      className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500 uppercase">
                          Part {i + 1}
                        </span>
                        <button
                          onClick={() => removePart(i)}
                          className="text-red-600 hover:text-red-800 font-semibold text-sm"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="relative mb-2">
                        <label className="text-xs text-gray-600 mb-1 block">
                          Part code
                        </label>
                        <Input
                          type="text"
                          value={part.code}
                          onChange={(e) =>
                            handlePartCodeChange(i, e.target.value)
                          }
                          onFocus={() => {
                            setPartSearchIndex(i);
                            setPartSearchTerm(part.code);
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setPartSearchIndex(null);
                              setPartSearchTerm("");
                            }, 200);
                          }}
                          placeholder="Type code or description..."
                          className="w-full border-2 border-primary rounded px-3 py-2 text-sm outline-none focus:border-primary"
                        />

                        {partSearchIndex === i &&
                          getFilteredItems.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white border-2 border-primary border-t-0 rounded-b-lg max-h-[300px] overflow-y-auto z-[500] shadow-lg">
                              {getFilteredItems.map((item, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => selectItem(i, item)}
                                  className="px-3 py-2 cursor-pointer hover:bg-green-50 border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-semibold text-sm text-gray-900">
                                    {item.code}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {item.desc} — ${item.price.toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>

                      <Input
                        type="text"
                        value={part.desc}
                        onChange={(e) => updatePart(i, "desc", e.target.value)}
                        placeholder="Search or type description..."
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-2 outline-none focus:border-primary"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">
                            Price per part ($)
                          </label>
                          <Input
                            type="number"
                            value={part.price}
                            onChange={(e) =>
                              updatePart(
                                i,
                                "price",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            placeholder="0.00"
                            step="0.01"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">
                            Quantity
                          </label>
                          <Input
                            type="number"
                            value={part.qty}
                            onChange={(e) =>
                              updatePart(
                                i,
                                "qty",
                                parseInt(e.target.value) || 1,
                              )
                            }
                            placeholder="1"
                            min="1"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addPart}
                    disabled={parts.length >= 15}
                    className="w-full bg-white border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-600 font-medium hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    + Add part
                  </button>
                </div>
              )}
            </div>

            <div className="mb-5">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                PARTS ON ARRIVAL PHOTOS{" "}
                <span className="text-gray-400 font-normal normal-case">
                  (optional)
                </span>
              </label>
              <Input
                ref={partsPhotoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    handleAddPartsPhotos(files);
                    e.target.value = "";
                  }
                }}
              />
              {partsOnArrivalPhotos.length > 0 ? (
                <div className="space-y-3">
                  {partsOnArrivalPhotos.length === 1 ? (
                    <div className="relative w-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={partsOnArrivalPhotos[0]}
                        alt="Parts Photo"
                        className="w-full rounded-lg"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                        Photo 1 of 1
                      </div>
                      <button
                        onClick={() => removePartsPhoto(0)}
                        className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold hover:bg-red-600 shadow-lg"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <Carousel className="w-full">
                      <CarouselContent>
                        {partsOnArrivalPhotos.map((photo, index) => (
                          <CarouselItem key={index}>
                            <div className="relative w-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                              <img
                                src={photo}
                                alt={`Parts Photo ${index + 1}`}
                                className="w-full rounded-lg"
                                loading="lazy"
                              />
                              <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                                Photo {index + 1} of{" "}
                                {partsOnArrivalPhotos.length}
                              </div>
                              <button
                                onClick={() => removePartsPhoto(index)}
                                className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold hover:bg-red-600 shadow-lg"
                              >
                                ×
                              </button>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </Carousel>
                  )}
                  <Button
                    onClick={() => partsPhotoInputRef.current?.click()}
                    className="w-full border border-dashed border-teal-500 bg-emerald-50 rounded-lg py-3 text-gray-600 text-sm font-medium hover:bg-teal-50 flex items-center justify-center gap-2"
                  >
                    📦 Add more photos
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => partsPhotoInputRef.current?.click()}
                  className="w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg py-6 text-gray-500 text-sm flex flex-col items-center gap-2 hover:border-gray-400 transition-colors"
                >
                  <div className="text-2xl">📦</div>
                  <div className="font-medium text-gray-700">
                    Tap to photograph parts on arrival
                  </div>
                  <div className="text-xs text-gray-500">
                    Condition record — pallet, box or loose parts
                  </div>
                </button>
              )}
            </div>

            <div className="mb-5">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                COLLECTION INSTRUCTIONS / NOTES
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special handling or collection instructions..."
                rows={3}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="space-y-3 mb-5">
              <div className="border-2 border-red-300 rounded-lg p-3 bg-red-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-red-700">
                      🚨 Urgent
                    </div>
                    <div className="text-xs text-red-600">
                      Highlighted red — jumps the queue
                    </div>
                  </div>
                  <Switch
                    checked={urgent}
                    onCheckedChange={setUrgent}
                    className="ml-3"
                    aria-label="Toggle urgent"
                  />
                </div>
              </div>

              <div className="border border-gray-300 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      🏭 Internal TGAEP
                    </div>
                    <div className="text-xs text-gray-500">
                      Internal job — no invoice at dispatch
                    </div>
                  </div>
                  <Switch
                    checked={isInternal}
                    onCheckedChange={setIsInternal}
                    className="ml-3"
                    aria-label="Toggle internal TGAEP"
                  />
                </div>
              </div>

              <div className="border border-gray-300 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      Freight requested
                    </div>
                    <div className="text-xs text-gray-500">
                      Customer requested freight — cost added at dispatch
                    </div>
                  </div>
                  <Switch
                    checked={freightRequested}
                    onCheckedChange={setFreightRequested}
                    className="ml-3"
                    aria-label="Toggle freight requested"
                  />
                </div>
              </div>

              <div className="border border-gray-300 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      Minimum charge
                    </div>
                    <div className="text-xs text-gray-500">
                      Apply $60.00 minimum (Silver)
                    </div>
                  </div>
                  <Switch
                    checked={minCharge}
                    onCheckedChange={setMinCharge}
                    className="ml-3"
                    aria-label="Toggle minimum charge"
                  />
                </div>
              </div>

              <div className="border-2 border-orange-300 rounded-lg p-3 bg-orange-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-orange-700">
                      🔧 Flag this job
                    </div>
                    <div className="text-xs text-orange-600">
                      Mark for follow-up — price correction, missing Xero item,
                      etc
                    </div>
                  </div>
                  <Switch
                    checked={flagged}
                    onCheckedChange={setFlagged}
                    className="ml-3"
                    aria-label="Toggle flag job"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 pb-4 border-t border-gray-200">
              <button
                onClick={closeSheet}
                className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-3 text-base font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={
                  (!customer && !isInternal) ||
                  createJobMutation.isPending ||
                  updateJobMutation.isPending
                }
                className="flex-1 bg-primary text-white rounded-lg py-3 text-base font-semibold hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {createJobMutation.isPending || updateJobMutation.isPending
                  ? "Saving..."
                  : "Save Job"}
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}
