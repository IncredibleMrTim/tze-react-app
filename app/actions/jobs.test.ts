import { describe, expect, it, vi, afterEach } from "vitest";
import { getJobsAction } from "@/actions/jobs";
import { getJobs } from "@/lib/db";
import type { IJob } from "@/types/interfaces";

// @/lib/db talks to Prisma/Postgres — mock it so this test never touches
// a real database, and so we can force the error branch on demand.
vi.mock("@/lib/db", () => ({
  getJobs: vi.fn(),
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
