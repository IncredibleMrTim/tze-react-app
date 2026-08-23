"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import type { IJob, IJigAssignment } from "@/types/interfaces";
import { jigUsed } from "@/lib/helpers";
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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { LuCamera } from "react-icons/lu";
import { useToast } from "@/hooks/useToast";
import { useJobs, useUpdateJob } from "@/hooks/useJobs";
import {
  useJigAssignments,
  useCreateJigAssignment,
  useUpdateJigAssignment,
  useRemoveJigAssignment,
  useCompleteJig,
} from "@/hooks/useJigAssignments";
import { useJigs } from "@/hooks/useJigs";
import { useJigPhotos, useSetJigPhoto } from "@/hooks/useJigPhotos";
import { useJigRework, useSetJigRework } from "@/hooks/useJigRework";
import { uploadImageToBlob, toSignedImageUrl } from "@/lib/blob-upload";
import { JobCard } from "@/components/JobCard";
import { JobAssignmentPanel } from "@/components/JobAssignmentPanel";

export default function JigClient() {
  const { showToast } = useToast();

  // Live updates arrive via WebSocket; hooks poll only as a backstop
  const { data: jobs = [], isLoading: jobsLoading } = useJobs();
  const { data: jigAssignments = [], isLoading: jigsLoading } =
    useJigAssignments();
  const { data: jigsList = [], isLoading: jigsListLoading } = useJigs();

  // Mutation hooks
  const createAssignmentMutation = useCreateJigAssignment();
  const updateAssignmentMutation = useUpdateJigAssignment();
  const removeAssignmentMutation = useRemoveJigAssignment();
  const completeJigMutation = useCompleteJig();
  const updateJobMutation = useUpdateJob();
  const { data: jigPhotos = {} } = useJigPhotos();
  const setJigPhotoMutation = useSetJigPhoto();
  const { data: jigRework = {} } = useJigRework();
  const setJigReworkMutation = useSetJigRework();

  const isLoading = jobsLoading || jigsLoading || jigsListLoading;
  const isPending =
    createAssignmentMutation.isPending ||
    updateAssignmentMutation.isPending ||
    removeAssignmentMutation.isPending ||
    completeJigMutation.isPending ||
    updateJobMutation.isPending;

  const [selectedJigId, setSelectedJigId] = useState<string | null>(null);
  const [showJobSelector, setShowJobSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobForAssignment, setSelectedJobForAssignment] =
    useState<IJob | null>(null);
  const [assignmentPercentage, setAssignmentPercentage] = useState("25");
  const [poComplete, setPoComplete] = useState(false);
  const [isUploadingJigPhoto, setIsUploadingJigPhoto] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [incompleteJigInfo, setIncompleteJigInfo] = useState({
    name: "",
    percent: 0,
  });
  const [editingAssignment, setEditingAssignment] = useState<{
    assignment: IJigAssignment;
    job: IJob;
  } | null>(null);
  const [editPercentage, setEditPercentage] = useState("");
  const [editPoComplete, setEditPoComplete] = useState(false);
  const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(
    null,
  );

  const photoInputRef = useRef<HTMLInputElement>(null);

  const selectedJigName =
    jigsList.find((j) => j.id === selectedJigId)?.name ?? null;

  const isSelectedJigRework = selectedJigId
    ? (jigRework[selectedJigId] ?? false)
    : false;

  const availableJobs = jobs.filter((j) => {
    if (j.dispatchedAt) return false;
    // Once every part on the PO has been processed there's nothing left to jig
    if (j.poComplete) return false;
    // Still allow it to be added elsewhere, just not a second time to the
    // same jig it's already loaded on
    const isOnSelectedJig = jigAssignments.some(
      (g) =>
        g.jobId === j.id && g.jigId === selectedJigId && g.status === "ACTIVE",
    );
    return !isOnSelectedJig;
  });

  const getJigJobs = (jigId: string) => {
    return jigAssignments.filter(
      (g) => g.jigId === jigId && g.status === "ACTIVE",
    );
  };

  const handleSelectJig = (jigId: string) => {
    setSelectedJigId(selectedJigId === jigId ? null : jigId);
  };

  const handleAddJobClick = () => {
    setShowJobSelector(true);
    setSearchTerm("");
    setSelectedJobForAssignment(null);
    setAssignmentPercentage("25");
    setPoComplete(false);
  };

  const handleJobClick = (job: IJob) => {
    // Toggle: clicking the already-expanded card closes it, clicking another
    // job card swaps which one is expanded (only one shows the panel at a time)
    if (selectedJobForAssignment?.id === job.id) {
      setSelectedJobForAssignment(null);
      return;
    }
    setSelectedJobForAssignment(job);
    setPoComplete(job.poComplete);
  };

  const handleConfirmAssignment = () => {
    if (!selectedJigId || !selectedJigName || !selectedJobForAssignment) return;

    const pct = parseInt(assignmentPercentage) || 20;
    const used = jigUsed(selectedJigId, jigAssignments);
    const available = 100 - used;

    if (pct > available) {
      showToast(`Only ${available}% space remaining on ${selectedJigName}`);
      return;
    }

    if (pct <= 0 || pct > 100) {
      showToast("Please enter a valid percentage (1-100)");
      return;
    }

    // Create new assignment
    const newAssignment: IJigAssignment = {
      id: crypto.randomUUID(),
      jigId: selectedJigId,
      jigName: selectedJigName,
      jobId: selectedJobForAssignment.id,
      pct,
      pic: null,
      photoId: null,
      status: "ACTIVE",
      loadedAt: Date.now(),
      completedAt: null,
    };

    // Update job if PO complete status changed
    if (poComplete !== selectedJobForAssignment.poComplete) {
      updateJobMutation.mutate(
        { jobId: selectedJobForAssignment.id, job: { poComplete } },
        {
          onSuccess: () => {
            // After job update, create the assignment
            createAssignmentMutation.mutate(newAssignment, {
              onSuccess: () => {
                showToast(`Job assigned to ${selectedJigName}`);
                setShowJobSelector(false);
                setSelectedJobForAssignment(null);
              },
              onError: () => {
                showToast("Failed to assign job");
              },
            });
          },
          onError: () => {
            showToast("Failed to update job");
          },
        },
      );
    } else {
      // Just create the assignment
      createAssignmentMutation.mutate(newAssignment, {
        onSuccess: () => {
          showToast(`Job assigned to ${selectedJigName}`);
          setShowJobSelector(false);
          setSelectedJobForAssignment(null);
        },
        onError: () => {
          showToast("Failed to assign job");
        },
      });
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!selectedJigId || !selectedJigName) return;

    setIsUploadingJigPhoto(true);
    try {
      // A unique path per upload, not a fixed one per jig — JigPhoto rows
      // are permanent history (see photoId on JigAssignment), so
      // overwriting the same blob path on every upload would silently
      // rewrite older jobs' historical photos to whatever's newest.
      const pathname = `jigs/${selectedJigName}-${Date.now()}.jpg`;
      const url = await uploadImageToBlob(file, pathname);
      await setJigPhotoMutation.mutateAsync({
        jigId: selectedJigId,
        photoUrl: url,
      });
      showToast("Photo uploaded");
    } catch (error) {
      console.error("Failed to upload jig photo:", error);
      showToast("Failed to upload photo");
    } finally {
      setIsUploadingJigPhoto(false);
    }
  };

  const handleRemoveClick = (assignmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingRemoveId(assignmentId);
  };

  const handleConfirmRemove = (assignmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Only remove this one assignment — a job can be spread across several
    // jigs, so removing it from one shouldn't touch its other jig links
    removeAssignmentMutation.mutate(assignmentId, {
      onSuccess: () => {
        showToast("Job removed from JIG");
        setConfirmingRemoveId(null);
      },
      onError: () => {
        showToast("Failed to remove job");
        setConfirmingRemoveId(null);
      },
    });
  };

  const handleCancelRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingRemoveId(null);
  };

  const handleCompleteJigClick = () => {
    if (!selectedJigId || !selectedJigName) return;

    const used = jigUsed(selectedJigId, jigAssignments);
    if (used < 100 && !isSelectedJigRework) {
      setIncompleteJigInfo({
        name: selectedJigName,
        percent: Math.round(used),
      });
      setShowIncompleteDialog(true);
      return;
    }

    setShowCompleteDialog(true);
  };

  const handleConfirmComplete = () => {
    if (!selectedJigId || !selectedJigName) return;

    completeJigMutation.mutate(selectedJigId, {
      onSuccess: () => {
        showToast(`${selectedJigName} marked complete`);
        setShowCompleteDialog(false);
      },
      onError: () => {
        showToast("Failed to complete jig");
        setShowCompleteDialog(false);
      },
    });
  };

  const handleEditJobClick = (assignment: IJigAssignment, job: IJob) => {
    setEditingAssignment({ assignment, job });
    setEditPercentage(assignment.pct.toString());
    setEditPoComplete(job.poComplete);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAssignment) return;

    const newPct = parseInt(editPercentage) || 20;
    if (newPct <= 0 || newPct > 100) {
      showToast("Please enter a valid percentage (1-100)");
      return;
    }

    // Update assignment percentage
    updateAssignmentMutation.mutate(
      {
        assignmentId: editingAssignment.assignment.id,
        assignment: { pct: newPct },
      },
      {
        onSuccess: () => {
          // Update job if PO complete changed
          if (editPoComplete !== editingAssignment.job.poComplete) {
            updateJobMutation.mutate(
              {
                jobId: editingAssignment.job.id,
                job: { poComplete: editPoComplete },
              },
              {
                onSuccess: () => {
                  showToast("Changes saved");
                  setShowEditModal(false);
                  setEditingAssignment(null);
                },
                onError: () => {
                  showToast("Failed to update job");
                },
              },
            );
          } else {
            showToast("Changes saved");
            setShowEditModal(false);
            setEditingAssignment(null);
          }
        },
        onError: () => {
          showToast("Failed to save changes");
        },
      },
    );
  };

  const filteredJobs = availableJobs.filter((j) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      j.po_number.toLowerCase().includes(term) ||
      j.customer_name.toLowerCase().includes(term) ||
      j.parts.some(
        (p) =>
          p.code.toLowerCase().includes(term) ||
          p.desc.toLowerCase().includes(term),
      )
    );
  });

  const spaceRemaining = selectedJigId
    ? 100 - Math.round(jigUsed(selectedJigId, jigAssignments))
    : 0;

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <div className="text-lg text-gray-600">Loading jigs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Heading */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
        TAP A JIG TO MANAGE IT
      </h2>

      {/* JIG Grid */}
      <div className="grid grid-cols-3 gap-3">
        {jigsList.map((jig) => {
          const used = jigUsed(jig.id, jigAssignments);
          const pct = Math.round(used);
          const jigJobs = getJigJobs(jig.id);
          const isEmpty = pct === 0;
          const isFull = pct === 100;
          const isPartial = pct > 0 && pct < 100;
          const isSelected = selectedJigId === jig.id;
          const isJigRework = jigRework[jig.id] ?? false;

          // Color based on fill percentage (selected state just adds shadow)
          const borderColor = isFull
            ? "border-green-400 bg-green-50"
            : isPartial
              ? "border-orange-400 bg-orange-50"
              : "border-gray-200";

          return (
            <Card
              key={jig.id}
              onClick={() => handleSelectJig(jig.id)}
              className={`px-0 py-4 text-center cursor-pointer transition-all hover:shadow-md border-2 ${borderColor} ${
                isSelected ? "shadow-lg ring-2 ring-blue-500" : ""
              }`}
            >
              <div className="px-4">
                <div className="font-bold text-lg mb-2">{jig.name}</div>
                <div className="text-sm text-gray-500 mb-1">
                  {isEmpty ? "Empty" : `${pct}% used`}
                </div>
                <div
                  className={`relative h-2 mb-2 w-full overflow-hidden rounded-full flex ${isJigRework ? "bg-red-400" : "bg-secondary"}`}
                >
                  {jigJobs.map((assignment, index) => {
                    const isLastJob = index === jigJobs.length - 1;
                    // Border marks the boundary with whatever comes next —
                    // another job's segment, or the unfilled rework remainder
                    const showDivider = !isLastJob || (isJigRework && !isFull);
                    return (
                      <div
                        key={assignment.id}
                        className={`h-full bg-primary ${showDivider ? "border-r-2 border-white" : ""}`}
                        style={{ width: `${assignment.pct}%` }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="text-xs text-gray-500 w-full">
                {isEmpty
                  ? "–"
                  : `${jigJobs.length} job${jigJobs.length !== 1 ? "s" : ""} ${jigRework[jig.id] ? "(Rework)" : ""}`}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected JIG Details */}
      {selectedJigId && selectedJigName && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">
              {selectedJigName} {jigRework[selectedJigId] ? "(Rework)" : ""}
            </h3>
            <span className="text-lg text-gray-500">
              {Math.round(jigUsed(selectedJigId, jigAssignments))}% loaded
            </span>
          </div>
          <div
            onClick={() => photoInputRef.current?.click()}
            className={`border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-gray-400 transition-colors overflow-hidden ${
              jigPhotos[selectedJigId] ? "" : "p-12"
            }`}
          >
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(file);
              }}
            />
            {isUploadingJigPhoto ? (
              <p className="text-gray-500">Uploading...</p>
            ) : jigPhotos[selectedJigId] ? (
              <div className="relative w-full aspect-video">
                <Image
                  src={toSignedImageUrl(jigPhotos[selectedJigId])}
                  alt="Loaded JIG"
                  fill
                  className="object-cover rounded"
                  unoptimized
                />
              </div>
            ) : (
              <>
                <LuCamera className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">Tap to photograph loaded JIG</p>
              </>
            )}
          </div>
          {/* Jobs on this JIG */}
          {getJigJobs(selectedJigId).length > 0 && (
            <div className="space-y-3">
              {getJigJobs(selectedJigId).map((assignment) => {
                const job = jobs.find((j) => j.id === assignment.jobId);
                if (!job) return null;

                const isConfirming = confirmingRemoveId === assignment.id;

                return (
                  <div
                    key={assignment.id}
                    onClick={() =>
                      !isConfirming && handleEditJobClick(assignment, job)
                    }
                    className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-bold text-lg">{job.po_number}</div>
                        <div className="text-sm text-gray-600">
                          {job.customer_name} —{" "}
                          {job.plating === "gold" ? "Gold" : "Silver"}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {assignment.pct}% · tap to edit
                      </div>
                    </div>

                    {isConfirming ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={(e) => handleConfirmRemove(assignment.id, e)}
                          className="bg-red-100 text-red-700 hover:bg-red-200 border-2 border-red-300 font-semibold"
                        >
                          Yes, remove
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelRemove}
                          className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300 font-semibold"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={(e) => handleRemoveClick(assignment.id, e)}
                        className="w-full border-2 border-red-300 text-red-600 hover:bg-red-50"
                        disabled={isPending}
                      >
                        Remove from JIG
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="border border-gray-300 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Rework</div>
                <div className="text-xs text-gray-500">
                  Remainder of Jig is Rework - can be marked as complete.
                </div>
              </div>
              <Switch
                checked={isSelectedJigRework}
                onCheckedChange={(checked) =>
                  setJigReworkMutation.mutate(
                    {
                      jigId: selectedJigId,
                      isRework: checked,
                    },
                    {
                      onError: () =>
                        showToast("Failed to update rework status"),
                    },
                  )
                }
                className="ml-3"
                aria-label="Toggle rework"
              />
            </div>
          </div>
          <Button
            onClick={handleAddJobClick}
            disabled={
              jigUsed(selectedJigId, jigAssignments) >= 100 || isPending
            }
            className="w-full h-12 md:h-14 text-sm md:text-lg font-semibold"
            size="lg"
          >
            + Add job to {selectedJigName}
          </Button>
          {/* Mark JIG Complete */}
          <Button
            onClick={handleCompleteJigClick}
            disabled={isPending}
            className={`w-full h-12 md:h-14 text-sm md:text-lg font-semibold ${
              jigUsed(selectedJigId, jigAssignments) < 100 &&
              !isSelectedJigRework
                ? "bg-gray-300 text-gray-500 hover:bg-gray-400"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
            size="lg"
          >
            ✓ Mark {selectedJigName} complete — out of tank
          </Button>
        </div>
      )}

      {/* Job Selector Modal */}
      {showJobSelector && selectedJigId && selectedJigName && (
        <Drawer
          open
          onOpenChange={(open) => !open && setShowJobSelector(false)}
        >
          <DrawerContent className="mx-auto h-[90%] md:max-w-[430px] rounded-t-[20px] border-none bg-white">
            <div className="p-6 flex-1 min-h-0 overflow-y-auto">
              <DrawerTitle className="text-2xl font-bold mb-4">
                Add job to {selectedJigName}
              </DrawerTitle>

              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
                <p className="text-blue-700 font-medium">
                  {spaceRemaining}% space remaining on {selectedJigName}
                </p>
              </div>

              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                SELECT A JOB
              </h3>

              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search PO, customer, parts..."
                className="w-full mb-4"
              />

              <div className="space-y-2 mb-4">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    jigAssignments={[]}
                    onClick={() => handleJobClick(job)}
                    showArrivalTime={true}
                    expandedContent={
                      selectedJobForAssignment?.id === job.id ? (
                        <JobAssignmentPanel
                          job={job}
                          jigAssignments={jigAssignments}
                          selectedJigName={selectedJigName ?? ""}
                          spaceRemaining={spaceRemaining}
                          assignmentPercentage={assignmentPercentage}
                          onPercentageChange={setAssignmentPercentage}
                          poComplete={poComplete}
                          onPoCompleteChange={setPoComplete}
                          onConfirm={handleConfirmAssignment}
                          onCancel={() => setSelectedJobForAssignment(null)}
                          isPending={isPending}
                        />
                      ) : undefined
                    }
                  />
                ))}

                {filteredJobs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No jobs found
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => setShowJobSelector(false)}
                className="w-full h-12 text-base"
              >
                Close
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Edit Job Assignment Modal */}
      {showEditModal && editingAssignment && selectedJigId && selectedJigName && (
        <Drawer open onOpenChange={(open) => !open && setShowEditModal(false)}>
          <DrawerContent className="mx-auto h-[90%] md:max-w-[430px] rounded-t-[20px] border-none bg-white">
            <div className="p-6 flex-1 min-h-0 overflow-y-auto">
              <DrawerTitle className="text-2xl font-bold mb-4">
                Edit JIG — {editingAssignment.job.po_number}
              </DrawerTitle>

              {/* Job Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="font-bold text-xl mb-1">
                  {editingAssignment.job.po_number}
                </div>
                <div className="text-gray-600">
                  {editingAssignment.job.customer_name}
                </div>
              </div>

              {/* JIG Status */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
                <p className="text-blue-700 font-medium">
                  {selectedJigName} —{" "}
                  {Math.round(jigUsed(selectedJigId, jigAssignments))}% loaded
                </p>
              </div>

              {/* Space Percentage */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Space this job takes (%)
                </label>
                <Input
                  type="number"
                  value={editPercentage}
                  onChange={(e) => setEditPercentage(e.target.value)}
                  min="1"
                  max="100"
                  className="w-full text-lg"
                />
              </div>

              {/* PO Complete Toggle */}
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-base font-semibold text-gray-900">
                      PO complete — all parts processed
                    </div>
                    <div className="text-sm text-gray-500">
                      Job moves to Dispatch when toggled on
                    </div>
                  </div>
                  <Switch
                    checked={editPoComplete}
                    onCheckedChange={setEditPoComplete}
                    className="ml-3"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <Button
                onClick={handleSaveEdit}
                disabled={isPending}
                className="w-full h-12 text-base font-semibold bg-emerald-500 hover:bg-emerald-600 mb-3"
              >
                Save changes
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="w-full h-12 text-base"
              >
                Cancel
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Incomplete JIG Dialog */}
      <AlertDialog
        open={showIncompleteDialog}
        onOpenChange={setShowIncompleteDialog}
      >
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Cannot complete {incompleteJigInfo.name} — only{" "}
              {incompleteJigInfo.percent}% loaded.
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-2">
              <span className="block">
                JIG must be at 100% before marking complete.
              </span>
              <span className="block font-medium">
                Add a Rework allocation or additional job to fill the remaining{" "}
                {100 - incompleteJigInfo.percent}%.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete JIG Confirmation Dialog */}
      <AlertDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
      >
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded">
          <AlertDialogHeader>
            <AlertDialogTitle>Mark {selectedJigName} as complete?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-2">
              <span className="block">
                This will mark the JIG as complete and move it out of the tank.
              </span>
              <span className="block font-medium">
                Are you sure you want to continue?
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmComplete}>
              Yes, mark complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
