import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JobCard } from "@/components/JobCard";
import type { IJob } from "@/types/interfaces";

const baseJob: IJob = {
  id: "job-1",
  po_number: "PO-1001",
  customer_name: "Acme Co",
  customer_account: "ACME",
  customer_email: "",
  customer_contact: "",
  parts: [],
  plating: "silver",
  weightKg: 0,
  stringCount: 0,
  stringsRequired: false,
  requiresWeighing: false,
  freightRequested: false,
  minCharge: false,
  flagged: false,
  notes: "",
  manualPO: false,
  urgent: false,
  isInternal: false,
  isRework: false,
  partDescription: "",
  createdAt: Date.now(),
  priceOverride: false,
  priceOverrideValue: 0,
  freightCost: 0,
  dispatchedAt: null,
  invoiceNumber: null,
  poComplete: false,
  fpnDownloaded: false,
  fpnHidden: false,
  csvDownloaded: false,
};

describe("JobCard plating badge", () => {
  it("shows 'Silver Plating' when the job is silver", () => {
    render(
      <JobCard
        job={{ ...baseJob, plating: "silver" }}
        jigAssignments={[]}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText("Silver Plating")).toBeInTheDocument();
    expect(screen.queryByText("Gold Plating")).not.toBeInTheDocument();
  });

  it("shows 'Gold Plating' when the job is gold", () => {
    render(
      <JobCard
        job={{ ...baseJob, plating: "gold" }}
        jigAssignments={[]}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText("Gold Plating")).toBeInTheDocument();
    expect(screen.queryByText("Silver Plating")).not.toBeInTheDocument();
  });
});

describe("JobCard onClick", () => {
  it("calls onClick when the card is clicked", async () => {
    // vi.fn() creates a bare mock function with no real implementation to
    // call through to — unlike vi.spyOn, there's nothing to "restore" here,
    // we're just recording calls/args to assert against.
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <JobCard job={baseJob} jigAssignments={[]} onClick={handleClick} />,
    );

    // Click bubbles up from the PO number text to the Card's onClick handler.
    await user.click(screen.getByText("PO-1001"));

    expect(handleClick).toHaveBeenCalledOnce();
  });
});
