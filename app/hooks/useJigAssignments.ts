import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { completeJigAction, clearJobJigsAction } from '@/actions/jigs'
import type { IJigAssignment } from '@/types/interfaces'

/**
 * Fetch all jig assignments from the API
 */
async function fetchJigAssignments(): Promise<IJigAssignment[]> {
  const res = await fetch('/api/jigs')
  if (!res.ok) throw new Error('Failed to fetch jig assignments')
  return res.json()
}

/**
 * Hook to fetch all jig assignments with automatic refresh
 * Refresh more frequently (5s) since this is active work monitoring
 */
export function useJigAssignments(refetchInterval = 5000) {
  return useQuery({
    queryKey: ['jig-assignments'],
    queryFn: fetchJigAssignments,
    refetchInterval,
    staleTime: 2000, // Consider fresh for only 2 seconds
  })
}

/**
 * Hook to create a jig assignment
 */
export function useCreateJigAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assignment: IJigAssignment) => {
      const res = await fetch('/api/jigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment),
      })
      if (!res.ok) throw new Error('Failed to create jig assignment')
      return res.json()
    },

    onMutate: async (newAssignment: IJigAssignment) => {
      await queryClient.cancelQueries({ queryKey: ['jig-assignments'] })

      const previousAssignments = queryClient.getQueryData<IJigAssignment[]>(['jig-assignments'])

      queryClient.setQueryData<IJigAssignment[]>(['jig-assignments'], (old) => {
        return old ? [...old, newAssignment] : [newAssignment]
      })

      return { previousAssignments }
    },

    onError: (_error, _newAssignment, context) => {
      if (context?.previousAssignments) {
        queryClient.setQueryData(['jig-assignments'], context.previousAssignments)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jig-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

/**
 * Hook to update a jig assignment
 */
export function useUpdateJigAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ assignmentId, assignment }: { assignmentId: string; assignment: Partial<IJigAssignment> }) => {
      const res = await fetch(`/api/jigs/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment),
      })
      if (!res.ok) throw new Error('Failed to update jig assignment')
      return res.json()
    },

    onMutate: async ({ assignmentId, assignment }) => {
      await queryClient.cancelQueries({ queryKey: ['jig-assignments'] })

      const previousAssignments = queryClient.getQueryData<IJigAssignment[]>(['jig-assignments'])

      queryClient.setQueryData<IJigAssignment[]>(['jig-assignments'], (old) => {
        return old
          ? old.map((a) => (a.id === assignmentId ? { ...a, ...assignment } : a))
          : []
      })

      return { previousAssignments }
    },

    onError: (_error, _variables, context) => {
      if (context?.previousAssignments) {
        queryClient.setQueryData(['jig-assignments'], context.previousAssignments)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jig-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

/**
 * Hook to delete all jig assignments for a job (clear job from jigs)
 */
export function useDeleteJigAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => clearJobJigsAction(jobId),

    onMutate: async (jobId: string) => {
      await queryClient.cancelQueries({ queryKey: ['jig-assignments'] })

      const previousAssignments = queryClient.getQueryData<IJigAssignment[]>(['jig-assignments'])

      queryClient.setQueryData<IJigAssignment[]>(['jig-assignments'], (old) => {
        return old ? old.filter((a) => a.jobId !== jobId) : []
      })

      return { previousAssignments }
    },

    onError: (_error, _jobId, context) => {
      if (context?.previousAssignments) {
        queryClient.setQueryData(['jig-assignments'], context.previousAssignments)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jig-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

/**
 * Hook to mark a jig as complete
 */
export function useCompleteJig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jigName: string) => completeJigAction(jigName),

    onMutate: async (jigName: string) => {
      await queryClient.cancelQueries({ queryKey: ['jig-assignments'] })

      const previousAssignments = queryClient.getQueryData<IJigAssignment[]>(['jig-assignments'])

      const now = Date.now()
      queryClient.setQueryData<IJigAssignment[]>(['jig-assignments'], (old) => {
        return old
          ? old.map((a) =>
              a.jigName === jigName && a.status === 'ACTIVE'
                ? { ...a, status: 'CLEARED' as const, completedAt: now }
                : a
            )
          : []
      })

      return { previousAssignments }
    },

    onError: (_error, _jigName, context) => {
      if (context?.previousAssignments) {
        queryClient.setQueryData(['jig-assignments'], context.previousAssignments)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jig-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}
