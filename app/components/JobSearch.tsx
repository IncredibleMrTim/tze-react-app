"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { JobCard } from "@/components/JobCard";
import { EmptyState } from "@/components/EmptyState";
import { isReady, stageLabel } from "@/lib/helpers";
import type { IJob, IJigAssignment } from "@/types/interfaces";

interface JobSearchProps {
  jobs: IJob[];
  jigAssignments: IJigAssignment[];
  onSelectJob: (job: IJob) => void;
  onActiveChange?: (isActive: boolean) => void;
}

/**
 * Self-contained search bar + date range filter + predictive dropdown that
 * renders stage-grouped results (Dispatched, Ready, WIP, Intake) across all
 * jobs. Renders nothing below the filter controls when no filter is active,
 * so the parent can show its own default list in that case.
 */
export function JobSearch({
  jobs,
  jigAssignments,
  onSelectJob,
  onActiveChange,
}: JobSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateMode, setDateMode] = useState<"created" | "dispatched">(
    "created",
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasActiveFilters = Boolean(searchTerm || dateFrom || dateTo);

  useEffect(() => {
    onActiveChange?.(hasActiveFilters);
  }, [hasActiveFilters, onActiveChange]);

  const handleClear = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setShowDropdown(false);
  };

  // Close predictive dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!hasActiveFilters) return [];

    return jobs.filter((j) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();

        const matchesPO = j.po_number.toLowerCase().includes(term);
        const matchesCustomer = j.customer_name.toLowerCase().includes(term);
        const matchesAccount = j.customer_account.toLowerCase().includes(term);
        const matchesContact = j.customer_contact.toLowerCase().includes(term);
        const matchesEmail = j.customer_email.toLowerCase().includes(term);
        const matchesInvoice = j.invoiceNumber?.toLowerCase().includes(term);
        const matchesNotes = j.notes.toLowerCase().includes(term);
        const matchesPartDesc = j.partDescription.toLowerCase().includes(term);
        const matchesParts = j.parts.some(
          (p) =>
            p.code.toLowerCase().includes(term) ||
            p.desc.toLowerCase().includes(term),
        );

        if (
          !matchesPO &&
          !matchesCustomer &&
          !matchesAccount &&
          !matchesContact &&
          !matchesEmail &&
          !matchesInvoice &&
          !matchesNotes &&
          !matchesPartDesc &&
          !matchesParts
        ) {
          return false;
        }
      }

      const dateToCheck =
        dateMode === "created" ? j.createdAt : j.dispatchedAt || 0;
      if (dateFrom && dateToCheck < new Date(dateFrom).getTime()) return false;
      if (dateTo && dateToCheck > new Date(dateTo).getTime() + 86400000)
        return false;

      return true;
    });
  }, [jobs, searchTerm, dateFrom, dateTo, dateMode, hasActiveFilters]);

  // Predictive dropdown results (top 10 matches when typing)
  const predictions = searchTerm
    ? filtered.slice(0, 10).sort((a, b) => b.createdAt - a.createdAt)
    : [];

  const dispatched = filtered.filter((j) => j.dispatchedAt);
  const ready = filtered.filter(
    (j) => isReady(j, jigAssignments) && !j.dispatchedAt,
  );
  const wip = filtered.filter(
    (j) =>
      !isReady(j, jigAssignments) &&
      !j.dispatchedAt &&
      jigAssignments.some((g) => g.jobId === j.id && g.status === "ACTIVE"),
  );
  const intake = filtered.filter(
    (j) => !j.dispatchedAt && !jigAssignments.some((g) => g.jobId === j.id),
  );

  const handleSelectJob = (job: IJob) => {
    onSelectJob(job);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || predictions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % predictions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + predictions.length) % predictions.length,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (predictions[selectedIndex]) {
        handleSelectJob(predictions[selectedIndex]);
        inputRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div>
      <div className="mb-3 relative" ref={searchRef}>
        <input
          ref={inputRef}
          type="text"
          placeholder="🔍 Search PO, customer, account, invoice, parts, notes..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(e.target.value.length > 0);
            setSelectedIndex(0);
          }}
          onFocus={() => searchTerm && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-base outline-none focus:border-primary"
          autoComplete="off"
        />

        {showDropdown && predictions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {predictions.map((job, idx) => (
              <div
                key={job.id}
                onClick={() => handleSelectJob(job)}
                className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                  idx === selectedIndex ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-900">
                      {job.po_number}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {job.customer_name}
                      {job.invoiceNumber && (
                        <span className="ml-2 text-gray-400">
                          • {job.invoiceNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        job.dispatchedAt
                          ? "bg-green-100 text-green-700"
                          : job.poComplete
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {stageLabel(job, jigAssignments)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="dd/mm/yyyy"
          className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-base outline-none focus:border-primary"
        />
        <span className="flex items-center text-gray-400 text-sm">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="dd/mm/yyyy"
          className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-base outline-none focus:border-primary"
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

      {hasActiveFilters && (
        <div>
          {dispatched.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-2 px-0 mt-1.5">
                Dispatched ({dispatched.length})
              </div>
              {dispatched.map((j) => (
                <JobCard
                  key={j.id}
                  job={j}
                  jigAssignments={jigAssignments}
                  onClick={() => handleSelectJob(j)}
                  showArrivalTime={true}
                  showJigStatus={true}
                />
              ))}
            </div>
          )}

          {ready.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-2 px-0 mt-1.5">
                Ready to Dispatch ({ready.length})
              </div>
              {ready.map((j) => (
                <JobCard
                  key={j.id}
                  job={j}
                  jigAssignments={jigAssignments}
                  onClick={() => handleSelectJob(j)}
                  showArrivalTime={true}
                  showJigStatus={true}
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
                  jigAssignments={jigAssignments}
                  onClick={() => handleSelectJob(j)}
                  showArrivalTime={true}
                  showJigStatus={true}
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
                  jigAssignments={jigAssignments}
                  onClick={() => handleSelectJob(j)}
                  showArrivalTime={true}
                  showJigStatus={true}
                />
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <EmptyState
              icon="🤷"
              title="No results"
              message="Nothing matched your search or date range"
            />
          )}
        </div>
      )}
    </div>
  );
}
