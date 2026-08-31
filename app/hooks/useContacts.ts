import { useQuery } from '@tanstack/react-query'
import type { IContact } from '@/types/interfaces'

/**
 * Fetch all contacts from the API
 */
export async function fetchContacts(): Promise<IContact[]> {
  const res = await fetch('/api/contacts')
  if (!res.ok) throw new Error('Failed to fetch contacts')
  return res.json()
}

/**
 * Hook to fetch all contacts
 * Contacts change rarely, so we use a long stale time and no auto-refresh
 */
export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })
}
