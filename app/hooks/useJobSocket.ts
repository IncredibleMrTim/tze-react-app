"use client";

import { useEffect } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type { IJob, IJigAssignment } from "@/types/interfaces";
import type { OnFloorJobsPage } from "@/hooks/useJobs";
import { isAssignable, isOnFloor } from "@/lib/helpers";

export function useJobSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let socket: WebSocket;
    let reconnectDelay = 1000;

    function connect() {
      const bypassToken = process.env.NEXT_PUBLIC_WS_PROTECTION_BYPASS;
      const bypassQuery = bypassToken ? `?x-vercel-protection-bypass=${bypassToken}` : "";
      socket = new WebSocket(`${location.origin.replace("http", "ws")}/api/ws${bypassQuery}`);

      socket.onmessage = (event) => {
        const { channel, payload } = JSON.parse(event.data);

        if (channel === "job_updates") {
          const { type, job, jobId } = payload;
          queryClient.setQueryData<IJob[]>(["jobs"], (old) => {
            // The full job list is now fetched lazily (only once search is
            // used) — an empty/unset cache means nobody's using it yet, so
            // leave it alone rather than seeding a partial one.
            if (!old) return old;
            if (type === "deleted") return old.filter((j) => j.id !== jobId);
            if (type === "created") {
              // The client that created this job already has it in the
              // cache via optimistic update — the server echoes the
              // "created" event back to every connected client, including
              // the one that made the request, so appending blindly would
              // duplicate it. Update in place if it's already there.
              return old.some((j) => j.id === job.id)
                ? old.map((j) => (j.id === job.id ? job : j))
                : [...old, job];
            }
            return old.map((j) => (j.id === job.id ? job : j));
          });

          // Backstop for useAssignableJobs() (the jig page's "add job to
          // jig" selector) — same origin-echo/dedupe handling as the full
          // ["jobs"] cache above, but also drops/adds jobs as they cross
          // the dispatched/PO-complete boundary on "updated" events.
          queryClient.setQueryData<IJob[]>(["jobs", "assignable"], (old) => {
            if (!old) return old;
            if (type === "deleted") return old.filter((j) => j.id !== jobId);
            if (!isAssignable(job)) return old.filter((j) => j.id !== job.id);
            return old.some((j) => j.id === job.id)
              ? old.map((j) => (j.id === job.id ? job : j))
              : [...old, job];
          });

          const jigAssignments =
            queryClient.getQueryData<IJigAssignment[]>(["jig-assignments"]) ??
            [];

          // (Re-)entering on-floor status without already being in a
          // loaded page (e.g. sent back for rework) needs a refetch —
          // its correct position depends on createdAt relative to
          // already-loaded pages, so it's set as a flag here and acted on
          // after setQueryData, rather than invalidating from inside the
          // updater itself.
          let needsOnFloorRefetch = false;

          queryClient.setQueryData<InfiniteData<OnFloorJobsPage>>(
            ["jobs", "on-floor"],
            (old) => {
              if (!old) return old;

              const targetId = type === "deleted" ? jobId : job.id;
              const existsInCache = old.pages.some((page) =>
                page.jobs.some((j) => j.id === targetId),
              );

              if (type === "deleted") {
                if (!existsInCache) return old;
                return {
                  ...old,
                  pages: old.pages.map((page) => ({
                    ...page,
                    jobs: page.jobs.filter((j) => j.id !== jobId),
                    totalCount: page.totalCount - 1,
                  })),
                };
              }

              const jobIsOnFloor = isOnFloor(job, jigAssignments);

              if (type === "created") {
                // Same origin-echo duplication risk as the ["jobs"] update above.
                if (!jobIsOnFloor || existsInCache) return old;
                const [firstPage, ...restPages] = old.pages;
                return {
                  ...old,
                  pages: [
                    {
                      ...firstPage,
                      jobs: [job, ...firstPage.jobs],
                      totalCount: firstPage.totalCount + 1,
                    },
                    ...restPages.map((page) => ({
                      ...page,
                      totalCount: page.totalCount + 1,
                    })),
                  ],
                };
              }

              // "updated"
              if (!jobIsOnFloor) {
                // Left on-floor status (dispatched, or became ready) —
                // drop it from wherever it's currently shown.
                if (!existsInCache) return old;
                return {
                  ...old,
                  pages: old.pages.map((page) => ({
                    ...page,
                    jobs: page.jobs.filter((j) => j.id !== job.id),
                    totalCount: page.totalCount - 1,
                  })),
                };
              }

              if (existsInCache) {
                return {
                  ...old,
                  pages: old.pages.map((page) => ({
                    ...page,
                    jobs: page.jobs.map((j) => (j.id === job.id ? job : j)),
                  })),
                };
              }

              needsOnFloorRefetch = true;
              return old;
            },
          );

          if (needsOnFloorRefetch) {
            queryClient.invalidateQueries({ queryKey: ["jobs", "on-floor"] });
          }
        }

        if (channel === "jig_updates") {
          const {
            type,
            assignment,
            assignmentId,
            jobId,
            jigId,
            photoUrl,
            isRework,
          } = payload;

          if (type === "photo-updated") {
            queryClient.setQueryData<Record<string, string>>(
              ["jig-photos"],
              (old = {}) => ({ ...old, [jigId]: photoUrl }),
            );
            return;
          }

          if (type === "photo-cleared") {
            queryClient.setQueryData<Record<string, string>>(
              ["jig-photos"],
              (old = {}) => {
                const rest = { ...old };
                delete rest[jigId];
                return rest;
              },
            );
            return;
          }

          if (type === "rework-updated") {
            queryClient.setQueryData<Record<string, boolean>>(
              ["jig-rework"],
              (old = {}) => ({ ...old, [jigId]: isRework }),
            );
            return;
          }

          if (type === "rework-cleared") {
            queryClient.setQueryData<Record<string, boolean>>(
              ["jig-rework"],
              (old = {}) => {
                const rest = { ...old };
                delete rest[jigId];
                return rest;
              },
            );
            return;
          }

          queryClient.setQueryData<IJigAssignment[]>(
            ["jig-assignments"],
            (old = []) => {
              if (type === "deleted")
                return old.filter((a) => a.id !== assignmentId);
              if (type === "deleted-by-job")
                return old.filter((a) => a.jobId !== jobId);
              if (type === "created") {
                // Same origin-echo duplication risk as job_updates above.
                return old.some((a) => a.id === assignment.id)
                  ? old.map((a) => (a.id === assignment.id ? assignment : a))
                  : [...old, assignment];
              }
              return old.map((a) => (a.id === assignment.id ? assignment : a));
            },
          );
        }
      };

      socket.onopen = () => {
        reconnectDelay = 1000;
      };
      socket.onclose = () => {
        setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      };
    }

    connect();
    return () => socket?.close();
  }, [queryClient]);
}
