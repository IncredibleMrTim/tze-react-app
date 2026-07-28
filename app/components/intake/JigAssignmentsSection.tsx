"use client";
import { useJig } from "@/hooks/useJigAssignments";
import { toSignedImageUrl } from "@/lib/blob-upload";
import { jigsOf } from "@/lib/helpers";
import type { IJigAssignment } from "@/types/interfaces";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface JigAssignmentsSectionProps {
  jobId: string;
  jigAssignments: IJigAssignment[];
}

/**
 * Jig assignments carousel — shows each jig a job has run on, with its
 * reference photo (live for jigs still in progress, a persisted snapshot
 * for cleared ones, since the shared photo slot is reset once a jig is
 * freed up for the next job).
 */
export function JigAssignmentsSection({
  jobId,
  jigAssignments,
}: JigAssignmentsSectionProps) {
  const { getJigPhotosByJobId } = useJig();
  const jigPhotos = getJigPhotosByJobId(jobId);
  const jobJigAssignments = jigsOf(jobId, jigAssignments);

  return (
    <div className="mb-4">
      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
        JIG ASSIGNMENTS
      </h3>
      {jobJigAssignments.length > 0 ? (
        <div className="space-y-2">
          <div className="flex-1">
            <Carousel className="w-full">
              <CarouselContent>
                {jigPhotos.map((jigPic, idx) => {
                  const jig = jobJigAssignments.find(
                    (j) => j.jigName === jigPic.jigName,
                  );
                  return (
                    <CarouselItem key={idx}>
                      {jigPic.photo && (
                        <div className="relative w-full border border-gray-200 border-b-0 rounded-t-lg overflow-hidden">
                          <img
                            src={toSignedImageUrl(jigPic.photo)}
                            alt={`Parts photo ${idx + 1}`}
                            className="w-full rounded-t-lg"
                          />
                          <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
                            Jig {idx + 1} of {jigPhotos.length}
                          </div>
                        </div>
                      )}
                      {jig && (
                        <div
                          key={jig.id}
                          className={`bg-white border border-gray-200 p-3 ${jigPic.photo ? "border-t-0 rounded-b-lg" : "rounded-lg"}`}
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
                            {new Date(jig.loadedAt).toLocaleDateString(
                              "en-NZ",
                              {
                                day: "numeric",
                                month: "short",
                              },
                            )}
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
                      )}
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
          No JIG assigned yet — assign from the JIG tab when loading.
        </div>
      )}
    </div>
  );
}
