'use client'

import { useState } from "react";
import type { IJob, IJigAssignment } from "@/types/interfaces";
import { JobCard } from "@/components/JobCard";
import { EmptyState } from "@/components/EmptyState";
import { isReady } from "@/lib/helpers";

interface JobsViewProps {
  jobs: IJob[];
  jigA: IJigAssignment[];
  onJobClick: (job: IJob) => void;
}

export const JobsView: React.FC<JobsViewProps> = ({
  jobs,
  jigA,
  onJobClick,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateMode, setDateMode] = useState<"created" | "dispatched">("created");

  const handleClear = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = searchTerm || dateFrom || dateTo;

  const filtered = jobs.filter((j) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      // Search across PO, customer, part codes, and descriptions
      const matchesPO = j.po_number.toLowerCase().includes(term);
      const matchesCustomer = j.customer_name.toLowerCase().includes(term);
      const matchesParts = j.parts.some(
        (p) =>
          p.code.toLowerCase().includes(term) ||
          p.desc.toLowerCase().includes(term),
      );
      if (!matchesPO && !matchesCustomer && !matchesParts) {
        return false;
      }
    }

    // Filter by date based on selected mode
    const dateToCheck =
      dateMode === "created" ? j.createdAt : j.dispatchedAt || 0;
    if (dateFrom && dateToCheck < new Date(dateFrom).getTime()) return false;
    if (dateTo && dateToCheck > new Date(dateTo).getTime() + 86400000)
      return false;

    return true;
  });

  const ready = filtered.filter((j) => isReady(j, jigA) && !j.dispatchedAt);
  const wip = filtered.filter(
    (j) =>
      !isReady(j, jigA) &&
      !j.dispatchedAt &&
      jigA.some((g) => g.jobId === j.id),
  );
  const intake = filtered.filter(
    (j) => !j.dispatchedAt && !jigA.some((g) => g.jobId === j.id),
  );

  return (
    <div>
      <div className="mb-3">
        <input
          type="text"
          placeholder="🔍 Search PO, customer, part code, description."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-base outline-none focus:border-primary"
        />
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="dd/mm/yyyy"
          className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <span className="flex items-center text-gray-400 text-sm">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="dd/mm/yyyy"
          className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={handleClear}
          className="px-4 py-2 border-2 border-gray-200 rounded-lg text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setDateMode("created")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            dateMode === "created"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Date created
        </button>
        <button
          onClick={() => setDateMode("dispatched")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            dateMode === "dispatched"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Date dispatched
        </button>
      </div>

      {ready.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-2 px-0 mt-1.5">
            Ready to Dispatch ({ready.length})
          </div>
          {ready.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              jigA={jigA}
              onClick={() => onJobClick(j)}
            />
          ))}
        </div>
      )}

      {wip.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-2 px-0 mt-1.5">
            Work in Progress ({wip.length})
          </div>
          {wip.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              jigA={jigA}
              onClick={() => onJobClick(j)}
            />
          ))}
        </div>
      )}

      {intake.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-2 px-0 mt-1.5">
            Intake ({intake.length})
          </div>
          {intake.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              jigA={jigA}
              onClick={() => onJobClick(j)}
            />
          ))}
        </div>
      )}

      {jobs.length === 0 && searchTerm.length === 0 && (
        <EmptyState
          icon="🔍"
          title="No jobs yet"
          message="Create your first job in the New Job tab"
        />
      )}

      {jobs.length === 0 && filtered.length === 0 && hasActiveFilters && (
        <EmptyState
          icon="🤷"
          title="No results"
          message="Nothing matched your search or date range"
        />
      )}

      {jobs.length > 0 &&
        !hasActiveFilters &&
        ready.length === 0 &&
        wip.length === 0 &&
        intake.length === 0 && (
          <EmptyState
            icon="🔍"
            title="Search all jobs"
            message="Type a PO number, customer name, part code or description — or pick a date range above"
          />
        )}
    </div>
  );
};
