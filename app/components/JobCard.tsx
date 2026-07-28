"use client";

import type { IJob, IJigAssignment } from "@/types/interfaces";
import {
  stageLabel,
  jobAgeTrafficLight,
  getActiveJigs,
  jobStatusTrafficLight,
} from "@/lib/helpers";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface JobCardProps {
  job: IJob;
  jigAssignments: IJigAssignment[];
  onClick: () => void;
  showArrivalTime?: boolean;
  showJigStatus?: boolean;
  isDispatch?: boolean;
  onSendBack?: () => void;
  isPending?: boolean;
  expandedContent?: React.ReactNode;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  jigAssignments,
  onClick,
  showArrivalTime = false,
  showJigStatus = false,
  isDispatch = false,
  onSendBack,
  isPending = false,
  expandedContent,
}) => {
  const label = stageLabel(job, jigAssignments);
  const activeJigs = getActiveJigs(job.id, jigAssignments);

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

  const showPills =
    job.isInternal ||
    job.freightRequested ||
    job.minCharge ||
    job.stringsRequired ||
    job.requiresWeighing;

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
              {showJigStatus && activeJigs.length > 0 && (
                <div className="text-xs my-1 w-full space-y-1">
                  {activeJigs.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex gap-2 items-center border p-2 rounded bg-white shadow"
                    >
                      <span>
                        {assignment.jigName}: {assignment.pct}% - (Loaded:{" "}
                        {new Date(assignment.loadedAt).toLocaleDateString()})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 text-xs">
          <div className={`flex pr-4 w-20 ${showPills ? "border-r" : ""}`}>
            <span
              className={`flex items-center shadow border rounded px-4 py-1 text-center text-wrap ${job.plating === "gold" ? "bg-yellow-300" : "bg-gray-300"} ${showPills ? "border-r" : ""}`}
            >
              {job.plating === "gold" ? "Gold Plating" : "Silver Plating"}
            </span>
          </div>
          {showPills && (
            <div className="flex gap-2 flex-wrap">
              {job.isInternal && (
                <span className="px-4 border rounded-full bg-blue-200 text-[10px] md:text-xs shadow h-5 text-center">
                  Internal
                </span>
              )}
              {job.freightRequested && (
                <span className="px-4 border rounded-full bg-orange-200 text-[10px] md:text-xs shadow h-5 text-center">
                  Freight
                </span>
              )}
              {job.requiresWeighing && (
                <span className="px-4 border rounded-full bg-green-200 text-[10px] md:text-xs shadow h-5 text-center">
                  Requires Weighing
                </span>
              )}
              {job.minCharge && (
                <span className="px-4 border rounded-full bg-red-200 text-[10px] md:text-xs shadow h-5 text-center">
                  Min-Charge
                </span>
              )}
              {job.stringsRequired && (
                <span className="px-4 border rounded-full bg-purple-200 text-[10px] md:text-xs shadow h-5 text-center">
                  Strings needed
                </span>
              )}
            </div>
          )}
        </div>

        {isDispatch && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onSendBack?.();
            }}
            className="w-full mt-3 bg-white border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-normal hover:bg-gray-50"
            variant="outline"
            disabled={isPending}
          >
            ↻ Send back for another run
          </Button>
        )}
        <div>{expandedContent}</div>
      </CardContent>
    </Card>
  );
};
