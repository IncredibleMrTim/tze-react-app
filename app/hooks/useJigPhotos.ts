import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJigPhotosAction, setJigPhotoAction } from "@/actions/jig-photos";

/**
 * Hook to fetch all jig photos, keyed by jig id
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
