'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'
import { useJobSocket } from '../hooks/useJobSocket'

function JobSocketListener() {
  useJobSocket()
  return null
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000, // Consider data fresh for 5 seconds
            refetchOnWindowFocus: true, // Refetch when user returns to tab
            refetchOnReconnect: true, // Refetch on reconnect
            retry: 1, // Retry failed requests once
          },
          mutations: {
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <JobSocketListener />
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
