"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { IJob, IJigAssignment } from "@/types/interfaces";

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
          queryClient.setQueryData<IJob[]>(["jobs"], (old = []) => {
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
