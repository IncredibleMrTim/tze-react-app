import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  completeJigAction,
  clearJobJigsAction,
  deleteJigAssignmentAction,
} from "@/actions/jigs";
import type { IJigAssignment } from "@/types/interfaces";
import { jigsOf } from "@/lib/helpers";
import { useJigPhotos, useJigPhotosByIds } from "./useJigPhotos";
/**
 * Fetch all jig assignments from the API
 */
async function fetchJigAssignments(): Promise<IJigAssignment[]> {
  const res = await fetch("/api/jigs");
  if (!res.ok) throw new Error("Failed to fetch jig assignments");
  return res.json();
}

/**
 * Hook to fetch all jig assignments with automatic refresh
 *
 * Live updates arrive via the jig_updates WebSocket (see useJobSocket) —
 * this poll is just a backstop for missed events, and is disabled entirely
 * in dev where a manual refresh is enough.
 */
export function useJigAssignments(
  refetchInterval: number | false = process.env.NODE_ENV === "development"
    ? false
    : 45000,
) {
  return useQuery({
    queryKey: ["jig-assignments"],
    queryFn: fetchJigAssignments,
    refetchInterval,
    staleTime: 5000,
  });
}

/**
 * Hook to create a jig assignment
 */
export function useCreateJigAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignment: IJigAssignment) => {
      const res = await fetch("/api/jigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignment),
      });
      if (!res.ok) throw new Error("Failed to create jig assignment");
      return res.json();
    },

    onMutate: async (newAssignment: IJigAssignment) => {
      await queryClient.cancelQueries({ queryKey: ["jig-assignments"] });

      const previousAssignments = queryClient.getQueryData<IJigAssignment[]>([
        "jig-assignments",
      ]);

      queryClient.setQueryData<IJigAssignment[]>(["jig-assignments"], (old) => {
        return old ? [...old, newAssignment] : [newAssignment];
      });

      return { previousAssignments };
    },

    onError: (_error, _newAssignment, context) => {
      if (context?.previousAssignments) {
        queryClient.setQueryData(
          ["jig-assignments"],
          context.previousAssignments,
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["jig-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

/**
 * Hook to update a jig assignment
 */
export function useUpdateJigAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      assignment,
    }: {
      assignmentId: string;
      assignment: Partial<IJigAssignment>;
    }) => {
      const res = await fetch(`/api/jigs/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignment),
      });
      if (!res.ok) throw new Error("Failed to update jig assignment");
      return res.json();
    },

    onMutate: async ({ assignmentId, assignment }) => {
      await queryClient.cancelQueries({ queryKey: ["jig-assignments"] });

      const previousAssignments = queryClient.getQueryData<IJigAssignment[]>([
        "jig-assignments",
      ]);

      queryClient.setQueryData<IJigAssignment[]>(["jig-assignments"], (old) => {
        return old
          ? old.map((a) =>
              a.id === assignmentId ? { ...a, ...assignment } : a,
            )
          : [];
      });

      return { previousAssignments };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousAssignments) {
        queryClient.setQueryData(
          ["jig-assignments"],
          context.previousAssignments,
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["jig-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

/**
 * Hook to delete all jig assignments for a job (clear job from jigs)
 */
export function useDeleteJigAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => clearJobJigsAction(jobId),

    onMutate: async (jobId: string) => {
      await queryClient.cancelQueries({ queryKey: ["jig-assignments"] });

      const previousAssignments = queryClient.getQueryData<IJigAssignment[]>([
        "jig-assignments",
      ]);

      queryClient.setQueryData<IJigAssignment[]>(["jig-assignments"], (old) => {
        return old ? old.filter((a) => a.jobId !== jobId) : [];
      });

      return { previousAssignments };
    },

    onError: (_error, _jobId, context) => {
      if (context?.previousAssignments) {
        queryClient.setQueryData(
          ["jig-assignments"],
          context.previousAssignments,
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["jig-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

/**
 * Hook to remove a single jig assignment (used when a job is spread across
 * multiple jigs and only one of them should be removed)
 */
export function useRemoveJigAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentId: string) =>
      deleteJigAssignmentAction(assignmentId),

    onMutate: async (assignmentId: string) => {
      await queryClient.cancelQueries({ queryKey: ["jig-assignments"] });

      const previousAssignments = queryClient.getQueryData<IJigAssignment[]>([
        "jig-assignments",
      ]);

      queryClient.setQueryData<IJigAssignment[]>(["jig-assignments"], (old) => {
        return old ? old.filter((a) => a.id !== assignmentId) : [];
      });

      return { previousAssignments };
    },

    onError: (_error, _assignmentId, context) => {
      if (context?.previousAssignments) {
        queryClient.setQueryData(
          ["jig-assignments"],
          context.previousAssignments,
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["jig-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

/**
 * Hook to mark a jig as complete
 */
export function useCompleteJig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jigId: string) => completeJigAction(jigId),

    onMutate: async (jigId: string) => {
      await queryClient.cancelQueries({ queryKey: ["jig-assignments"] });
      await queryClient.cancelQueries({ queryKey: ["jig-rework"] });

      const previousAssignments = queryClient.getQueryData<IJigAssignment[]>([
        "jig-assignments",
      ]);
      const previousRework = queryClient.getQueryData<Record<string, boolean>>([
        "jig-rework",
      ]);

      const now = Date.now();
      queryClient.setQueryData<IJigAssignment[]>(["jig-assignments"], (old) => {
        return old
          ? old.map((a) =>
              a.jigId === jigId && a.status === "ACTIVE"
                ? { ...a, status: "CLEARED" as const, completedAt: now }
                : a,
            )
          : [];
      });

      // Rework resets server-side once the jig is completed. The photo is
      // NOT cleared — JigPhoto is append-only, so the current photo stays
      // as permanent history (now referenced by the cleared assignments
      // above via photoId) and keeps showing as this jig's "live" photo
      // in the ["jig-photos"] cache until a new one is uploaded for the
      // next load cycle.
      queryClient.setQueryData<Record<string, boolean>>(
        ["jig-rework"],
        (old = {}) => ({
          ...old,
          [jigId]: false,
        }),
      );

      return { previousAssignments, previousRework };
    },

    onError: (_error, _jigId, context) => {
      if (context?.previousAssignments) {
        queryClient.setQueryData(
          ["jig-assignments"],
          context.previousAssignments,
        );
      }
      if (context?.previousRework) {
        queryClient.setQueryData(["jig-rework"], context.previousRework);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["jig-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jig-rework"] });
      queryClient.invalidateQueries({ queryKey: ["jig-photos-by-id"] });
    },
  });
}

// Both active and cleared jigs for the job are shown — a cleared jig is
// done with, but its photo (referenced by photoId) is permanent history
// and stays visible on the job even after the physical jig has moved on
// to a different load with its own new photo.
export const useJig = (jobId: string) => {
  const { data: jigAssignments = [] } = useJigAssignments();
  const { data: jigPhotos = {} } = useJigPhotos();

  const jobAssignments = jigsOf(jobId, jigAssignments);
  const clearedPhotoIds = jobAssignments
    .filter(
      (assignment): assignment is IJigAssignment & { photoId: string } =>
        assignment.status === "CLEARED" && !!assignment.photoId,
    )
    .map((assignment) => assignment.photoId);
  const { data: historicalPhotos = {} } = useJigPhotosByIds(clearedPhotoIds);

  const jigPhotosForJob = jobAssignments.map((assignment) => ({
    ...assignment,
    photo:
      assignment.status === "ACTIVE"
        ? (jigPhotos[assignment.jigId] ?? null)
        : assignment.photoId
          ? (historicalPhotos[assignment.photoId] ?? null)
          : null,
  }));

  return { jigPhotosForJob };
};
