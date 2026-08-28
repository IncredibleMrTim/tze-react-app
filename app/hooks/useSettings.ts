import { useQuery } from '@tanstack/react-query'
import type { ISettings } from '@/types/interfaces'

/**
 * Fetch settings from the API
 */
export async function fetchSettings(): Promise<ISettings> {
  const res = await fetch('/api/settings')
  if (!res.ok) throw new Error('Failed to fetch settings')
  return res.json()
}

/**
 * Hook to fetch settings
 * Settings change rarely, so we can cache for longer (60 seconds)
 */
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
    staleTime: 60000, // Consider fresh for 60 seconds
    refetchInterval: false, // Don't auto-refresh (settings rarely change)
  })
}
