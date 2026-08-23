import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getJigPhotosAction,
  getJigPhotosByIdsAction,
  setJigPhotoAction,
} from "@/actions/jig-photos";

/**
 * Hook to fetch all jigs' current (most recent) photo, keyed by jig id
 */
export function useJigPhotos() {
  return useQuery({
    queryKey: ["jig-photos"],
    queryFn: async () => {
      const result = await getJigPhotosAction();
      return result.photos;
    },
  });
}

/**
 * Hook to fetch specific historical jig photos by photo id, keyed by
 * photo id. Used to resolve a CLEARED assignment's photoId, since the
 * jig it was on may since have moved on to a newer photo.
 */
export function useJigPhotosByIds(photoIds: string[]) {
  const sortedIds = [...photoIds].sort();

  return useQuery({
    queryKey: ["jig-photos-by-id", sortedIds],
    queryFn: async () => {
      const result = await getJigPhotosByIdsAction(sortedIds);
      return result.photos;
    },
    enabled: sortedIds.length > 0,
  });
}

/**
 * Hook to set (create or replace) the photo for a jig
 */
export function useSetJigPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jigId, photoUrl }: { jigId: string; photoUrl: string }) =>
      setJigPhotoAction(jigId, photoUrl),

    onSuccess: (_data, { jigId, photoUrl }) => {
      queryClient.setQueryData<Record<string, string>>(
        ["jig-photos"],
        (old = {}) => ({ ...old, [jigId]: photoUrl }),
      );
    },
  });
}
