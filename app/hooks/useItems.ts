import { useQuery } from "@tanstack/react-query";
import type { IItem } from "@/types/interfaces";

/**
 * Fetch all items from the API
 */
async function fetchItems(query?: string): Promise<IItem[]> {
  const req = query ? `/api/items/${query}` : "/api/items";
  const res = await fetch(req);

  if (!res.ok) throw new Error("Failed to fetch items");
  return res.json();
}

/**
 * Hook to fetch all items
 * Items change rarely, so we use a long stale time and no auto-refresh
 */
export function useItems(query?: string) {
  return useQuery({
    queryKey: ["items", query],
    queryFn: () => fetchItems(query),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    enabled: !!query,
  });
}
