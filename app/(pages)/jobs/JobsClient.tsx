"use client";

import { useState, useRef, useEffect } from "react";
import { useJobs } from "@/hooks/useJobs";
import { useJigAssignments } from "@/hooks/useJigAssignments";
import { useContacts } from "@/hooks/useContacts";
import { useIntakeStore } from "@/store/useIntakeStore";
import { JobCard } from "@/components/JobCard";
import { EmptyState } from "@/components/EmptyState";
import { isReady, stageLabel } from "@/lib/helpers";
import type { IJob } from "@/types/interfaces";
import { useRouter } from "next/navigation";

export default function JobsClient() {
  // React Query hooks - auto-refresh for real-time updates
  const { data: jobs = [], isLoading: jobsLoading } = useJobs(10000);
  const { data: jigAssignments = [], isLoading: jigsLoading } =
    useJigAssignments(5000);
  const { data: CONTACTS = [], isLoading: contactsLoading } = useContacts();
  const { openJobForEdit, setCurrentJob } = useIntakeStore();
  const router = useRouter();

  const isLoading = jobsLoading || jigsLoading || contactsLoading;

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateMode, setDateMode] = useState<"created" | "dispatched">("created");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
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

  const handleJobClickAction = (job: IJob) => {
    openJobForEdit(
      job,
      CONTACTS.find((c) => c.name === job.customer_name) || null,
    );
    setCurrentJob(job);
    router.push("/intake");
  };

  const handleKeyDown = (e: React.KeyboardEvent, predictions: IJob[]) => {
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
        handleJobClickAction(predictions[selectedIndex]);
        setShowDropdown(false);
        inputRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const hasActiveFilters = searchTerm || dateFrom || dateTo;

  const filtered = jobs.filter((j) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();

      // Smart search across all job fields
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

  // Predictive search results (top 10 matches when typing)
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

  // Show loading state on initial load
  if (isLoading) {
    return (
      <div className="relative h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <div className="text-lg text-gray-600">Loading jobs...</div>
        </div>
      </div>
    );
  }

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
          onKeyDown={(e) => handleKeyDown(e, predictions)}
          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-base outline-none focus:border-primary"
          autoComplete="off"
        />

        {/* Predictive dropdown */}
        {showDropdown && predictions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {predictions.map((job, idx) => (
              <div
                key={job.id}
                onClick={() => {
                  handleJobClickAction(job);
                  setShowDropdown(false);
                }}
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
              onClick={() => handleJobClickAction(j)}
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
              onClick={() => handleJobClickAction(j)}
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
              onClick={() => handleJobClickAction(j)}
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
              onClick={() => handleJobClickAction(j)}
              showArrivalTime={true}
              showJigStatus={true}
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
        dispatched.length === 0 &&
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
}
