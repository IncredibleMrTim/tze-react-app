import { useQuery } from "@tanstack/react-query";
import { PoRule } from "@prisma/client";

/**
 * Fetches PO rules from the API endpoint.
 *
 * @returns Promise resolving to array of PO rules
 * @throws Error if fetch fails
 */
async function fetchPoRules(): Promise<PoRule[]> {
  const res = await fetch("/api/poRules");
  if (!res.ok) throw new Error("Failed to fetch PO Rules");

  return res.json();
}

/**
 * React Query hook for fetching and caching PO scanning rules.
 * Rules are cached for 5 minutes with a 10 minute garbage collection time.
 *
 * @returns Query result with PO rules data, loading state, and error state
 */
export function usePoRules() {
  return useQuery({
    queryKey: ["poRules"],
    queryFn: fetchPoRules,
    enabled: true,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60 * 1000,
  });
}
