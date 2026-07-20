"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { IJob } from "@/types/interfaces";

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
        const { type, job, jobId } = JSON.parse(event.data);

        queryClient.setQueryData<IJob[]>(["jobs"], (old = []) => {
          if (type === "deleted") return old.filter((j) => j.id !== jobId);
          if (type === "created") return [...old, job];
          return old.map((j) => (j.id === job.id ? job : j));
        });
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
