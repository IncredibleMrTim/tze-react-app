import { describe, expect, it, vi, afterEach } from "vitest";
import { Prisma } from "@prisma/client";
import { createJobAction, getJobsAction } from "@/actions/jobs";
import { createJob, getJobs } from "@/lib/db";
import type { IJob } from "@/types/interfaces";

// @/lib/db talks to Prisma/Postgres — mock it so this test never touches
// a real database, and so we can force the error branch on demand.
vi.mock("@/lib/db", () => ({
  getJobs: vi.fn(),
  createJob: vi.fn(),
}));

// next/cache's revalidatePath only works inside a request context, which
// these unit tests don't have.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("getJobsAction", () => {
  afterEach(() => {
    // Puts console.error back to its real implementation and clears any
    // spy call history, so a later test file's assertions on console.error
    // aren't polluted by calls made here.
    vi.restoreAllMocks();
  });

  it("returns jobs on success", async () => {
    const jobs = [{ id: "job-1" } as IJob];
    vi.mocked(getJobs).mockResolvedValueOnce(jobs);

    const result = await getJobsAction();

    expect(result).toEqual({ success: true, jobs });
  });

  it("returns a fallback error shape and logs when getJobs throws", async () => {
    // spyOn wraps the real console.error so it still runs (no console
    // spam suppression surprises) while letting us assert it was called.
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(getJobs).mockRejectedValueOnce(new Error("connection refused"));

    const result = await getJobsAction();

    expect(result).toEqual({
      success: false,
      jobs: [],
      error: "Failed to fetch jobs",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to fetch jobs:",
      expect.any(Error),
    );
  });
});

describe("createJobAction", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the created job on success", async () => {
    const job = { id: "job-1", po_number: "PO-1" } as IJob;
    vi.mocked(createJob).mockResolvedValueOnce(job);

    const result = await createJobAction(job);

    expect(result).toEqual(job);
  });

  it("turns a po_number unique-constraint violation into a friendly error", async () => {
    const job = { id: "job-1", po_number: "PO-1" } as IJob;
    vi.mocked(createJob).mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "5.0.0",
        meta: { target: ["po_number"] },
      }),
    );

    await expect(createJobAction(job)).rejects.toThrow(
      "PO number already exists",
    );
  });

  it("logs and rethrows other errors unchanged", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const job = { id: "job-1", po_number: "PO-1" } as IJob;
    vi.mocked(createJob).mockRejectedValueOnce(new Error("connection refused"));

    await expect(createJobAction(job)).rejects.toThrow("connection refused");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to create job:",
      expect.any(Error),
    );
  });
});
