"use client";

import type { IJob, IJigAssignment } from "@/types/interfaces";
import {
  stageLabel,
  jobAgeTrafficLight,
  isOnJig,
  getJobJigName,
  jobStatusTrafficLight,
} from "@/lib/helpers";
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
  const ageColors = jobAgeTrafficLight(job);
  const labelColors = jobStatusTrafficLight(job, jigAssignments);
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
        cardColors,
      )}
    >
      <CardContent className="p-3.5">
        <div className="flex justify-between items-start mb-2">
          <div className="w-full">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex justify-between w-full">
                <span className="font-bold text-base">{job.po_number}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: labelColors.color }}
                  ></span>
                  <span className="text-gray-900">{label}</span>
                </div>
              </div>
              {job.urgent && (
                <span className="flex items-center gap-1 text-xs font-medium text-red-700">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  URGENT
                </span>
              )}
            </div>
            <div className="text-[13px] text-gray-600 mb-1">
              {job.customer_name}
            </div>

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

            <div className="flex justify-between w-full">
              {showJigStatus && (
                <div className="text-xs  my-1 w-full">
                  {hasJig && (
                    <div className="flex gap-2 items-center border p-2 rounded bg-white shadow">
                      <span>{jigName}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 text-xs justify-between">
          <div className="flex border-r pr-2">
            <span
              className={`flex items-center shadow border rounded px-4 text-center border-r ${job.plating === "gold" ? "bg-yellow-300" : "bg-gray-300"}`}
            >
              {job.plating === "gold" ? "Gold Plating" : "Silver Plating"}
            </span>
          </div>
          {(job.isInternal ||
            job.freightRequested ||
            job.minCharge ||
            job.stringsRequired ||
            job.requiresWeighing) && (
            <div className="flex gap-2 flex-wrap">
              {job.isInternal && (
                <span className="px-4 border rounded-full bg-blue-200 text-[10px] md:text-xs shadow">
                  Internal
                </span>
              )}
              {job.freightRequested && (
                <span className="px-4 border rounded-full bg-orange-200 text-[10px] md:text-xs shadow">
                  Freight
                </span>
              )}
              {job.requiresWeighing && (
                <span className="px-4 border rounded-full bg-green-200 text-[10px] md:text-xs shadow">
                  Requires Weighing
                </span>
              )}
              {job.minCharge && (
                <span className="px-4 border rounded-full bg-red-200 text-[10px] md:text-xs shadow">
                  Min-Charge
                </span>
              )}
              {job.stringsRequired && (
                <span className="px-4 border rounded-full bg-purple-200 text-[10px] md:text-xs shadow">
                  Strings needed
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
