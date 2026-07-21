import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { completeJigAction, clearJobJigsAction, deleteJigAssignmentAction } from '@/actions/jigs'
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
 * Hook to remove a single jig assignment (used when a job is spread across
 * multiple jigs and only one of them should be removed)
 */
export function useRemoveJigAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (assignmentId: string) => deleteJigAssignmentAction(assignmentId),

    onMutate: async (assignmentId: string) => {
      await queryClient.cancelQueries({ queryKey: ['jig-assignments'] })

      const previousAssignments = queryClient.getQueryData<IJigAssignment[]>(['jig-assignments'])

      queryClient.setQueryData<IJigAssignment[]>(['jig-assignments'], (old) => {
        return old ? old.filter((a) => a.id !== assignmentId) : []
      })

      return { previousAssignments }
    },

    onError: (_error, _assignmentId, context) => {
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
      await queryClient.cancelQueries({ queryKey: ['jig-rework'] })
      await queryClient.cancelQueries({ queryKey: ['jig-photos'] })

      const previousAssignments = queryClient.getQueryData<IJigAssignment[]>(['jig-assignments'])
      const previousRework = queryClient.getQueryData<Record<string, boolean>>(['jig-rework'])
      const previousPhotos = queryClient.getQueryData<Record<string, string>>(['jig-photos'])

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

      // Rework and photo are both cleared server-side once the jig is completed
      queryClient.setQueryData<Record<string, boolean>>(['jig-rework'], (old = {}) => ({
        ...old,
        [jigName]: false,
      }))
      queryClient.setQueryData<Record<string, string>>(['jig-photos'], (old = {}) => {
        const rest = { ...old }
        delete rest[jigName]
        return rest
      })

      return { previousAssignments, previousRework, previousPhotos }
    },

    onError: (_error, _jigName, context) => {
      if (context?.previousAssignments) {
        queryClient.setQueryData(['jig-assignments'], context.previousAssignments)
      }
      if (context?.previousRework) {
        queryClient.setQueryData(['jig-rework'], context.previousRework)
      }
      if (context?.previousPhotos) {
        queryClient.setQueryData(['jig-photos'], context.previousPhotos)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jig-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['jig-rework'] })
      queryClient.invalidateQueries({ queryKey: ['jig-photos'] })
    },
  })
}
