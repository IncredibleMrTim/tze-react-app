import { describe, expect, it, vi, afterEach } from "vitest";
import { getJobsAction } from "@/actions/jobs";
import type { IJob } from "@/types/interfaces";

describe("getJobsAction", () => {
  afterEach(() => {
    // Puts console.error and global.fetch back to their real implementations
    // and clears any spy call history, so a later test file's assertions
    // aren't polluted by calls made here.
    vi.restoreAllMocks();
  });

  it("returns jobs on success", async () => {
    const jobs = [{ id: "job-1" } as IJob];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(jobs),
      }),
    );

    const result = await getJobsAction();

    expect(result).toEqual({ success: true, jobs });
  });

  it("returns a fallback error shape and logs when the Python API request fails", async () => {
    // spyOn wraps the real console.error so it still runs (no console
    // spam suppression surprises) while letting us assert it was called.
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("connection refused")),
    );

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
