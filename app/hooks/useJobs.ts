import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  createJobAction,
  updateJobAction,
  deleteJobAction,
} from "@/actions/jobs";
import { dispatchJobAction } from "@/actions/dispatch";
import type { IJob, IDispatchedJobRow } from "@/types/interfaces";

export interface OnFloorJobsPage {
  jobs: IJob[];
  nextCursor: string | null;
  totalCount: number;
}

export interface ReadyJobsPage {
  jobs: IJob[];
  nextCursor: string | null;
  totalCount: number;
}

export interface DispatchedJobsPage {
  jobs: IDispatchedJobRow[];
  nextCursor: string | null;
  totalCount: number;
}

/**
 * Fetch all jobs from the API
 */
async function fetchJobs(signal?: AbortSignal): Promise<IJob[]> {
  console.log("Fetching jobs from /api/jobs...");
  try {
    const res = await fetch("/api/jobs", {
      headers: {
        Accept: "application/json",
      },
      signal,
    });
    console.log("Jobs API response:", res.status, res.statusText);
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Jobs API error:", errorText);
      throw new Error(`Failed to fetch jobs: ${res.status}`);
    }
    const data = await res.json();
    console.log("Jobs fetched successfully:", data.length, "jobs");
    return data;
  } catch (error) {
    console.error("Error in fetchJobs:", error);
    throw error;
  }
}

/**
 * Fetch jobs still assignable to a jig (not dispatched, not PO complete)
 */
async function fetchAssignableJobs(signal?: AbortSignal): Promise<IJob[]> {
  const res = await fetch("/api/jobs/assignable", {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok)
    throw new Error(`Failed to fetch assignable jobs: ${res.status}`);
  return res.json();
}

/**
 * Fetch one page of on-floor jobs (not dispatched, not ready to be)
 */
async function fetchOnFloorJobs(
  cursor: string | undefined,
  signal?: AbortSignal,
): Promise<OnFloorJobsPage> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);

  const res = await fetch(`/api/jobs/on-floor?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) throw new Error(`Failed to fetch on-floor jobs: ${res.status}`);
  return res.json();
}

/**
 * Fetch one page of ready-to-dispatch jobs, optionally filtered by search
 */
async function fetchReadyJobs(
  cursor: string | undefined,
  search: string,
  signal?: AbortSignal,
): Promise<ReadyJobsPage> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (search) params.set("search", search);

  const res = await fetch(`/api/jobs/ready?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) throw new Error(`Failed to fetch ready jobs: ${res.status}`);
  return res.json();
}

/**
 * Fetch one page of dispatched jobs (the dispatch page's downloads list),
 * optionally filtered by search
 */
async function fetchDispatchedJobs(
  cursor: string | undefined,
  search: string,
  signal?: AbortSignal,
): Promise<DispatchedJobsPage> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (search) params.set("search", search);

  const res = await fetch(`/api/jobs/dispatched?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok)
    throw new Error(`Failed to fetch dispatched jobs: ${res.status}`);
  return res.json();
}

/**
 * Fetch a single job by ID with full data (including images)
 */
export async function fetchJobById(
  jobId: string,
  signal?: AbortSignal,
): Promise<IJob> {
  const res = await fetch(`/api/jobs/${jobId}`, { signal });
  if (!res.ok) throw new Error("Failed to fetch job");
  return res.json();
}

/**
 * Fetch only images for a job (poPages and partsOnArrivalPhotos)
 */
async function fetchJobImages(
  jobId: string,
  signal?: AbortSignal,
): Promise<{ poPages: string[]; partsOnArrivalPhotos: string[] }> {
  const res = await fetch(`/api/jobs/${jobId}/images`, { signal });
  if (!res.ok) throw new Error("Failed to fetch job images");
  return res.json();
}

/**
 * Hook to fetch all jobs with automatic refresh
 *
 * Live updates arrive via the job_updates WebSocket (see useJobSocket) —
 * this poll is just a backstop for missed events, and is disabled entirely
 * in dev where a manual refresh is enough.
 *
 * `enabled` lets callers that only need this for an occasional feature
 * (e.g. intake's search box) defer the full-table fetch until it's
 * actually needed, instead of firing on every mount.
 */
export function useJobs(
  refetchInterval: number | false = process.env.NODE_ENV === "development"
    ? false
    : 45000,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: ({ signal }) => fetchJobs(signal),
    refetchInterval,
    enabled,
    staleTime: 5000, // Consider fresh for 5 seconds
    retry: 2, // Only retry twice instead of default 3
    retryDelay: 1000, // Wait 1 second between retries
  });
}

/**
 * Hook to fetch jobs still assignable to a jig (not dispatched, not PO
 * complete), filtered server-side. Used by the jig page's "add job to jig"
 * selector instead of fetching every job and filtering client-side.
 *
 * Live updates arrive via the job_updates WebSocket as a backstop poll,
 * same pattern as useJobs/useOnFloorJobs.
 */
export function useAssignableJobs(
  refetchInterval: number | false = process.env.NODE_ENV === "development"
    ? false
    : 45000,
) {
  return useQuery({
    queryKey: ["jobs", "assignable"],
    queryFn: ({ signal }) => fetchAssignableJobs(signal),
    refetchInterval,
    staleTime: 5000,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Hook to fetch on-floor jobs (not dispatched, not ready to be) in pages
 * of 10, for the intake page's primary list. Dispatched/older jobs stay
 * reachable via search (useJobs), which fetches the full history.
 *
 * Live updates arrive via the job_updates WebSocket (see useJobSocket),
 * which also keeps this paginated cache in sync — new/updated on-floor
 * jobs are inserted/patched in place, jobs that leave on-floor status are
 * removed, without needing to refetch.
 */
export function useOnFloorJobs() {
  return useInfiniteQuery({
    queryKey: ["jobs", "on-floor"],
    queryFn: ({ pageParam, signal }) => fetchOnFloorJobs(pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 5000,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Hook to fetch ready-to-dispatch jobs in pages of 10, for the dispatch
 * page's primary list. `search` filters server-side (po_number/customer
 * name); changing it starts a fresh paginated query since it's part of the
 * query key.
 */
export function useReadyJobs(search: string) {
  return useInfiniteQuery({
    queryKey: ["jobs", "ready", search],
    queryFn: ({ pageParam, signal }) =>
      fetchReadyJobs(pageParam, search, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    // Keep showing the previous search's results while a new search term's
    // query loads, instead of isLoading flipping back to true and the page
    // falling back to its full-screen loading state on every keystroke.
    placeholderData: keepPreviousData,
    staleTime: 5000,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Hook to fetch dispatched jobs in pages of 10, for the dispatch page's
 * downloads list. `search` filters server-side (po_number/customer
 * name/invoice number); changing it starts a fresh paginated query since
 * it's part of the query key.
 */
export function useDispatchedJobs(search: string) {
  return useInfiniteQuery({
    queryKey: ["jobs", "dispatched", search],
    queryFn: ({ pageParam, signal }) =>
      fetchDispatchedJobs(pageParam, search, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    // Keep showing the previous search's results while a new search term's
    // query loads, instead of isLoading flipping back to true and the page
    // falling back to its full-screen loading state on every keystroke.
    placeholderData: keepPreviousData,
    staleTime: 5000,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Hook to fetch a single job by ID with full data (including images)
 */
export function useJobById(jobId: string | null) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: ({ signal }) => fetchJobById(jobId!, signal),
    enabled: !!jobId, // Only fetch if jobId is provided
    staleTime: 60000, // Cache for 1 minute (images don't change often)
  });
}

/**
 * Hook to fetch only images for a job
 */
export function useJobImages(jobId: string | null) {
  return useQuery({
    queryKey: ["job-images", jobId],
    queryFn: ({ signal }) => fetchJobImages(jobId!, signal),
    enabled: !!jobId, // Only fetch if jobId is provided
    staleTime: 60000, // Cache for 1 minute (images don't change often)
  });
}

/**
 * Hook to create a new job with optimistic updates
 */
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createJobAction,

    // Optimistic update - instantly add to UI
    onMutate: async (newJob: IJob) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["jobs"] });

      // Snapshot previous value
      const previousJobs = queryClient.getQueryData<IJob[]>(["jobs"]);

      // Optimistically update — only if the full list is actually loaded
      // (it's fetched lazily by callers like intake's search box now, so
      // an empty cache here just means nobody's using it yet; leave it
      // alone rather than seeding it with a partial one-job array).
      queryClient.setQueryData<IJob[]>(["jobs"], (old) => {
        return old ? [...old, newJob] : old;
      });

      // Return context with snapshot
      return { previousJobs };
    },

    // On error, rollback to previous state
    onError: (_error, _newJob, context) => {
      if (context?.previousJobs) {
        queryClient.setQueryData(["jobs"], context.previousJobs);
      }
    },

    // Always refetch after _error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

/**
 * Hook to update an existing job
 */
export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, job }: { jobId: string; job: Partial<IJob> }) =>
      updateJobAction(jobId, job),

    // Optimistic update
    onMutate: async ({ jobId, job }) => {
      await queryClient.cancelQueries({ queryKey: ["jobs"] });

      const previousJobs = queryClient.getQueryData<IJob[]>(["jobs"]);

      queryClient.setQueryData<IJob[]>(["jobs"], (old) => {
        return old
          ? old.map((j) => (j.id === jobId ? { ...j, ...job } : j))
          : old;
      });

      return { previousJobs };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousJobs) {
        queryClient.setQueryData(["jobs"], context.previousJobs);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "ready"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "dispatched"] });
    },
  });
}

/**
 * Hook to delete a job
 */
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => deleteJobAction(jobId),

    // Optimistic delete
    onMutate: async (jobId: string) => {
      await queryClient.cancelQueries({ queryKey: ["jobs"] });

      const previousJobs = queryClient.getQueryData<IJob[]>(["jobs"]);

      queryClient.setQueryData<IJob[]>(["jobs"], (old) => {
        return old ? old.filter((j) => j.id !== jobId) : old;
      });

      return { previousJobs };
    },

    onError: (_error, _jobId, context) => {
      if (context?.previousJobs) {
        queryClient.setQueryData(["jobs"], context.previousJobs);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

/**
 * Hook to dispatch a job
 */
export function useDispatchJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      job,
      invoiceNumber,
    }: {
      job: IJob;
      invoiceNumber: string;
    }) => dispatchJobAction(job, invoiceNumber),

    // Optimistic update - mark job as dispatched
    onMutate: async ({ job }) => {
      await queryClient.cancelQueries({ queryKey: ["jobs"] });

      const previousJobs = queryClient.getQueryData<IJob[]>(["jobs"]);

      queryClient.setQueryData<IJob[]>(["jobs"], (old) => {
        return old ? old.map((j) => (j.id === job.id ? job : j)) : old;
      });

      return { previousJobs };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousJobs) {
        queryClient.setQueryData(["jobs"], context.previousJobs);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "ready"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "dispatched"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] }); // Refresh settings for invSeq update
    },
  });
}
