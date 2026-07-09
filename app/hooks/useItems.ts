import { useQuery } from '@tanstack/react-query'
import type { IItem } from '@/types/interfaces'

/**
 * Fetch all items from the API
 */
async function fetchItems(): Promise<IItem[]> {
  const res = await fetch('/api/items')
  if (!res.ok) throw new Error('Failed to fetch items')
  return res.json()
}

/**
 * Hook to fetch all items
 * Items change rarely, so we use a long stale time and no auto-refresh
 */
export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })
}
