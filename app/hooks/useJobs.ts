import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createJobAction, updateJobAction, deleteJobAction } from '@/actions/jobs'
import { dispatchJobAction } from '@/actions/dispatch'
import type { IJob } from '@/types/interfaces'

/**
 * Fetch all jobs from the API
 */
async function fetchJobs(): Promise<IJob[]> {
  const res = await fetch('/api/jobs')
  if (!res.ok) throw new Error('Failed to fetch jobs')
  return res.json()
}

/**
 * Hook to fetch all jobs with automatic refresh
 */
export function useJobs(refetchInterval = 10000) {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
    refetchInterval, // Auto-refresh every 10 seconds by default
    staleTime: 5000, // Consider fresh for 5 seconds
  })
}

/**
 * Hook to create a new job with optimistic updates
 */
export function useCreateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createJobAction,

    // Optimistic update - instantly add to UI
    onMutate: async (newJob: IJob) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['jobs'] })

      // Snapshot previous value
      const previousJobs = queryClient.getQueryData<IJob[]>(['jobs'])

      // Optimistically update
      queryClient.setQueryData<IJob[]>(['jobs'], (old) => {
        return old ? [...old, newJob] : [newJob]
      })

      // Return context with snapshot
      return { previousJobs }
    },

    // On error, rollback to previous state
    onError: (_error, _newJob, context) => {
      if (context?.previousJobs) {
        queryClient.setQueryData(['jobs'], context.previousJobs)
      }
    },

    // Always refetch after _error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

/**
 * Hook to update an existing job
 */
export function useUpdateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ jobId, job }: { jobId: string; job: Partial<IJob> }) =>
      updateJobAction(jobId, job),

    // Optimistic update
    onMutate: async ({ jobId, job }) => {
      await queryClient.cancelQueries({ queryKey: ['jobs'] })

      const previousJobs = queryClient.getQueryData<IJob[]>(['jobs'])

      queryClient.setQueryData<IJob[]>(['jobs'], (old) => {
        return old
          ? old.map((j) => (j.id === jobId ? { ...j, ...job } : j))
          : []
      })

      return { previousJobs }
    },

    onError: (_error, _variables, context) => {
      if (context?.previousJobs) {
        queryClient.setQueryData(['jobs'], context.previousJobs)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

/**
 * Hook to delete a job
 */
export function useDeleteJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => deleteJobAction(jobId),

    // Optimistic delete
    onMutate: async (jobId: string) => {
      await queryClient.cancelQueries({ queryKey: ['jobs'] })

      const previousJobs = queryClient.getQueryData<IJob[]>(['jobs'])

      queryClient.setQueryData<IJob[]>(['jobs'], (old) => {
        return old ? old.filter((j) => j.id !== jobId) : []
      })

      return { previousJobs }
    },

    onError: (_error, _jobId, context) => {
      if (context?.previousJobs) {
        queryClient.setQueryData(['jobs'], context.previousJobs)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

/**
 * Hook to dispatch a job
 */
export function useDispatchJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ job, invoiceNumber }: { job: IJob; invoiceNumber: string }) =>
      dispatchJobAction(job, invoiceNumber),

    // Optimistic update - mark job as dispatched
    onMutate: async ({ job }) => {
      await queryClient.cancelQueries({ queryKey: ['jobs'] })

      const previousJobs = queryClient.getQueryData<IJob[]>(['jobs'])

      queryClient.setQueryData<IJob[]>(['jobs'], (old) => {
        return old
          ? old.map((j) => (j.id === job.id ? job : j))
          : []
      })

      return { previousJobs }
    },

    onError: (_error, _variables, context) => {
      if (context?.previousJobs) {
        queryClient.setQueryData(['jobs'], context.previousJobs)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['settings'] }) // Refresh settings for invSeq update
    },
  })
}
