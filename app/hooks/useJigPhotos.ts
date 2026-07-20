import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJigPhotosAction, setJigPhotoAction } from "@/actions/jig-photos";

/**
 * Hook to fetch all jig photos, keyed by jig name
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
    mutationFn: ({ jigName, photoUrl }: { jigName: string; photoUrl: string }) =>
      setJigPhotoAction(jigName, photoUrl),

    onSuccess: (_data, { jigName, photoUrl }) => {
      queryClient.setQueryData<Record<string, string>>(
        ["jig-photos"],
        (old = {}) => ({ ...old, [jigName]: photoUrl }),
      );
    },
  });
}
