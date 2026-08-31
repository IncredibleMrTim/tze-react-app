"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  fetchOnFloorJobs,
  fetchReadyJobs,
  fetchDispatchedJobs,
  fetchAssignableJobs,
  type OnFloorJobsPage,
  type ReadyJobsPage,
  type DispatchedJobsPage,
} from "@/hooks/useJobs";
import { fetchJigAssignments } from "@/hooks/useJigAssignments";
import { fetchContacts } from "@/hooks/useContacts";
import { fetchSettings } from "@/hooks/useSettings";
import { getJigsAction } from "@/actions/jigs";
import { getJigPhotosAction } from "@/actions/jig-photos";
import { getJigReworkAction } from "@/actions/jig-rework";

/**
 * Warms the query cache for intake, dispatch, and jig — but only for
 * whichever of those pages *isn't* the one currently mounting. Prefetching
 * the current page's own data here raced ahead of its Suspense-boundary
 * hydration (this component sits in the shell, above the page's Suspense
 * boundary, so its effect can land data in the cache before the page's own
 * hydration pass completes) — the server-rendered HTML shows the loading
 * state, but the client hydrates with data already loaded, which React
 * reports as a hydration mismatch. The current page always fetches its own
 * data anyway via its own hooks, so skipping it here is free.
 *
 * Re-runs on every client-side navigation (pathname changes), so moving
 * around the app keeps the *other* two pages' caches warm too.
 */
export function StartupPrefetch() {
  const queryClient = useQueryClient();
  const pathname = usePathname();

  useEffect(() => {
    const isIntake = pathname === "/intake";
    const isDispatch = pathname === "/dispatch";
    const isJig = pathname === "/jig";

    if (!isIntake) {
      // First page of on-floor jobs + contacts for the job drawer
      queryClient.prefetchInfiniteQuery({
        queryKey: ["jobs", "on-floor"],
        queryFn: ({ pageParam, signal }) =>
          fetchOnFloorJobs(pageParam, signal),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: OnFloorJobsPage) =>
          lastPage.nextCursor ?? undefined,
      });
      queryClient.prefetchQuery({
        queryKey: ["contacts"],
        queryFn: fetchContacts,
        staleTime: 5 * 60 * 1000,
      });
    }

    if (!isDispatch) {
      // First page of ready + dispatched jobs, plus settings for pricing
      queryClient.prefetchInfiniteQuery({
        queryKey: ["jobs", "ready", ""],
        queryFn: ({ pageParam, signal }) =>
          fetchReadyJobs(pageParam, "", signal),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: ReadyJobsPage) =>
          lastPage.nextCursor ?? undefined,
      });
      queryClient.prefetchInfiniteQuery({
        queryKey: ["jobs", "dispatched", ""],
        queryFn: ({ pageParam, signal }) =>
          fetchDispatchedJobs(pageParam, "", signal),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: DispatchedJobsPage) =>
          lastPage.nextCursor ?? undefined,
      });
      queryClient.prefetchQuery({
        queryKey: ["settings"],
        queryFn: fetchSettings,
        staleTime: 60000,
      });
    }

    if (!isJig) {
      // Jig list, assignable jobs, and current photos/rework state
      queryClient.prefetchQuery({
        queryKey: ["jigs"],
        queryFn: async () => {
          const result = await getJigsAction();
          if (!result.success) throw new Error(result.error);
          return result.jigs;
        },
      });
      queryClient.prefetchQuery({
        queryKey: ["jobs", "assignable"],
        queryFn: ({ signal }) => fetchAssignableJobs(signal),
      });
      queryClient.prefetchQuery({
        queryKey: ["jig-photos"],
        queryFn: async () => (await getJigPhotosAction()).photos,
      });
      queryClient.prefetchQuery({
        queryKey: ["jig-rework"],
        queryFn: async () => (await getJigReworkAction()).reworkByJig,
      });
    }

    // Shared across all three pages' isLoading gates — only safe to
    // prefetch when none of them is the page currently hydrating.
    if (!isIntake && !isDispatch && !isJig) {
      queryClient.prefetchQuery({
        queryKey: ["jig-assignments"],
        queryFn: fetchJigAssignments,
      });
    }
  }, [queryClient, pathname]);

  return null;
}
