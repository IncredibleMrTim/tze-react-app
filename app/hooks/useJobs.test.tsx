import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useJobs } from "@/hooks/useJobs";
import type { IJob } from "@/types/interfaces";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("useJobs", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns jobs when the fetch succeeds", async () => {
    const jobs = [{ id: "job-1" } as IJob];
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(jobs), { status: 200 }),
    );

    const { result } = renderHook(() => useJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(jobs);
    expect(fetch).toHaveBeenCalledWith("/api/jobs", {
      headers: { Accept: "application/json" },
    });
  });

  it("surfaces an error when the response is not ok", async () => {
    // useJobs retries twice with a 1s delay, so mock every call (not just
    // the first, and with a fresh Response each time since a body can only
    // be read once) and extend waitFor's timeout past the ~2s of retries.
    vi.mocked(fetch).mockImplementation(async () =>
      new Response("Server error", { status: 500, statusText: "Error" }),
    );

    const { result } = renderHook(() => useJobs(0), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });

    expect(result.current.error).toEqual(
      new Error("Failed to fetch jobs: 500"),
    );
  });
});
