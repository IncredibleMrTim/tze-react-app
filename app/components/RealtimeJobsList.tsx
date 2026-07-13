"use client";

import { useEffect, useState } from "react";
import { usePusherEvent } from "@/lib/pusher-client";
import type { IJob } from "@/types/interfaces";
import { toast } from "sonner";

interface RealtimeJobsListProps {
  initialJobs: IJob[];
}

/**
 * Example component showing real-time job updates using Pusher
 * Other users' changes appear instantly without refresh
 */
export function RealtimeJobsList({ initialJobs }: RealtimeJobsListProps) {
  const [jobs, setJobs] = useState<IJob[]>(initialJobs);

  // Listen for new jobs created by other users
  usePusherEvent<IJob>("jobs", "job:created", (newJob) => {
    setJobs((prev) => {
      // Avoid duplicates
      if (prev.some((j) => j.id === newJob.id)) return prev;
      toast.success(`New job created: ${newJob.poNumber}`);
      return [newJob, ...prev];
    });
  });

  // Listen for job updates from other users
  usePusherEvent<IJob>("jobs", "job:updated", (updatedJob) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === updatedJob.id ? updatedJob : job))
    );
    toast.info(`Job ${updatedJob.poNumber} updated`);
  });

  // Listen for job deletions from other users
  usePusherEvent<{ jobId: string }>("jobs", "job:deleted", ({ jobId }) => {
    setJobs((prev) => prev.filter((job) => job.id !== jobId));
    toast.info("Job deleted");
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm text-gray-500">Live updates enabled</span>
      </div>

      {jobs.length === 0 ? (
        <p className="text-gray-500">No jobs yet</p>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div key={job.id} className="border p-4 rounded-lg">
              <div className="font-semibold">{job.poNumber}</div>
              <div className="text-sm text-gray-600">{job.customer}</div>
              <div className="text-xs text-gray-500">{job.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
