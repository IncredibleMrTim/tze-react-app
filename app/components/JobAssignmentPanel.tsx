"use client";

import type { IJob, IJigAssignment } from "@/types/interfaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface JobAssignmentPanelProps {
  job: IJob;
  jigAssignments: IJigAssignment[];
  selectedJigName: string;
  spaceRemaining: number;
  assignmentPercentage: string;
  onPercentageChange: (value: string) => void;
  poComplete: boolean;
  onPoCompleteChange: (value: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export const JobAssignmentPanel: React.FC<JobAssignmentPanelProps> = ({
  job,
  jigAssignments,
  selectedJigName,
  spaceRemaining,
  assignmentPercentage,
  onPercentageChange,
  poComplete,
  onPoCompleteChange,
  onConfirm,
  onCancel,
  isPending = false,
}) => {
  const otherAssignments = jigAssignments.filter(
    (g) => g.jobId === job.id && g.status === "ACTIVE",
  );

  return (
    // Clicks inside the panel shouldn't bubble up to the card's onClick and re-trigger selection
    <div
      onClick={(e) => e.stopPropagation()}
      className="border rounded-lg p-4 bg-white shadow mt-3 space-y-4"
    >
      {otherAssignments.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 text-sm">
          Already loaded on{" "}
          {otherAssignments.map((g) => `${g.jigName} (${g.pct}%)`).join(", ")}.
        </div>
      )}

      <div>
        <label className="text-sm text-gray-600 mb-2 block">
          Space this job takes on {selectedJigName} (%)
        </label>
        <Input
          type="number"
          value={assignmentPercentage}
          onChange={(e) => onPercentageChange(e.target.value)}
          placeholder="e.g. 25"
          min="1"
          max={spaceRemaining}
          className="w-full"
        />
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col items-start justify-between">
          <div className="flex justify-between w-full text-base font-semibold text-gray-900">
            <span className="pb-2">PO complete</span>
            <Switch
              checked={poComplete}
              onCheckedChange={onPoCompleteChange}
              className="ml-3"
            />
          </div>

          <div className="text-sm text-gray-500">
            All parts processed, Job moves straight to Dispatch
          </div>
        </div>
      </div>

      <Button
        onClick={onConfirm}
        disabled={isPending}
        className="w-full h-12 text-base font-semibold bg-emerald-500 hover:bg-emerald-600"
      >
        Confirm — add to {selectedJigName}
      </Button>

      <Button
        variant="outline"
        onClick={onCancel}
        className="w-full h-12 text-base"
      >
        Cancel
      </Button>
    </div>
  );
};
