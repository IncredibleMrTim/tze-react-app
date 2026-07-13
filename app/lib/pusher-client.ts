"use client";

import Pusher from "pusher-js";
import { useEffect, useRef } from "react";

// Singleton pattern for client-side Pusher instance
let pusherInstance: Pusher | null = null;

/**
 * Get Pusher client instance for subscribing to events
 * Reuses same instance across all components
 */
export function getPusherClient(): Pusher {
  if (!pusherInstance) {
    pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }

  return pusherInstance;
}

/**
 * Hook to subscribe to Pusher channel and listen for events
 * Automatically unsubscribes on unmount
 *
 * @example
 * usePusherEvent("jobs", "job:created", (job) => {
 *   setJobs(prev => [...prev, job]);
 * });
 */
export function usePusherEvent<T = unknown>(
  channelName: string,
  eventName: string,
  callback: (data: T) => void
) {
  const callbackRef = useRef(callback);

  // Update callback ref without resubscribing
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName);

    const handler = (data: T) => {
      callbackRef.current(data);
    };

    channel.bind(eventName, handler);

    return () => {
      channel.unbind(eventName, handler);
      pusher.unsubscribe(channelName);
    };
  }, [channelName, eventName]);
}
