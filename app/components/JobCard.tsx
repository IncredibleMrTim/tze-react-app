'use client'

import type { IJob, IJigAssignment } from "@/types/interfaces";
import { stageLabel, trafficLight, isOnJig, getJobJigName } from "@/lib/helpers";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface JobCardProps {
  job: IJob;
  jigAssignments: IJigAssignment[];
  onClick: () => void;
  showArrivalTime?: boolean;
  showJigStatus?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  jigAssignments,
  onClick,
  showArrivalTime = false,
  showJigStatus = false,
}) => {
  const label = stageLabel(job, jigAssignments);
  const hasJig = isOnJig(job.id, jigAssignments);
  const jigName = getJobJigName(job.id, jigAssignments);

  // Traffic light colors based on age and status
  const ageColors = trafficLight(job);
  const cardColors = job.urgent
    ? "border-red-400 bg-red-50"
    : job.flagged
      ? "border-orange-400 bg-orange-50"
      : ageColors.label === "On time"
        ? "border-green-400 bg-green-50"
        : ageColors.label === "Due soon"
          ? "border-orange-400 bg-orange-50"
          : "border-red-400 bg-red-50";

  return (
    <Card
      onClick={onClick}
      className={cn(
        "border-2 mb-2.5 cursor-pointer active:scale-[0.98] transition-all hover:opacity-90",
        cardColors
      )}
    >
      <CardContent className="p-3.5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-base">{job.po_number}</span>
              {job.urgent && (
                <span className="flex items-center gap-1 text-xs font-medium text-red-700">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  URGENT
                </span>
              )}
            </div>
            <div className="text-[13px] text-gray-600 mb-1">{job.customer_name}</div>

            {showArrivalTime && (
              <div className="text-xs text-gray-500">
                Arrived:{" "}
                {new Date(job.createdAt).toLocaleDateString("en-NZ", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}{" "}
                {new Date(job.createdAt).toLocaleTimeString("en-NZ", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
            )}

            {job.partDescription && (
              <div className="text-sm text-gray-700 italic mt-1">
                {job.partDescription}
              </div>
            )}

            {showJigStatus && (
              <div className="text-xs text-gray-500 mt-1">
                {hasJig ? `On JIG ${jigName}` : "No JIG"}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-green-600"></span>
            <span className="text-gray-600">{label}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-700">
            {job.plating === "gold" ? "Gold" : "Silver"}
          </span>
          {job.stringsRequired && (
            <span className="text-blue-700 flex items-center gap-1">
              🎗️ Strings needed
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
