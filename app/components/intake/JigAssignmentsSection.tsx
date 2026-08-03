"use client";
import { useJig } from "@/hooks/useJigAssignments";
import { toSignedImageUrl } from "@/lib/blob-upload";
import { jigsOf } from "@/lib/helpers";
import type { IJigAssignment } from "@/types/interfaces";
import { LuCamera } from "react-icons/lu";
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
 * Jig assignments carousel — shows each jig the job is currently loaded
 * on, with its live reference photo. Cleared jigs are done with and are
 * not shown here.
 */
export function JigAssignmentsSection({
  jobId,
  jigAssignments,
}: JigAssignmentsSectionProps) {
  const { getJigPhotosByJobId } = useJig();
  const jigPhotos = getJigPhotosByJobId(jobId);
  const jobJigAssignments = jigsOf(jobId, jigAssignments).filter(
    (assignment) => assignment.status === "ACTIVE",
  );

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
                    (j) => j.jigId === jigPic.jigId,
                  );
                  return (
                    <CarouselItem key={idx}>
                      <div className="relative w-full border border-gray-200 border-b-0 rounded-t-lg overflow-hidden">
                        {jigPic.photo ? (
                          <img
                            src={toSignedImageUrl(jigPic.photo)}
                            alt={`Parts photo ${idx + 1}`}
                            className="w-full rounded-t-lg"
                          />
                        ) : (
                          // This jig hasn't been photographed yet for its current load.
                          <div className="w-full aspect-video flex flex-col items-center justify-center bg-gray-50 rounded-t-lg text-gray-400">
                            <LuCamera className="w-8 h-8 mb-2" />
                            <p className="text-xs">No photo available</p>
                          </div>
                        )}
                        <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
                          Jig {idx + 1} of {jigPhotos.length}
                        </div>
                      </div>
                      {jig && (
                        <div
                          key={jig.id}
                          className="bg-white border border-gray-200 border-t-0 rounded-b-lg p-3"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-semibold text-sm">
                              {jig.jigName}
                            </div>
                            <div className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              ACTIVE
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
