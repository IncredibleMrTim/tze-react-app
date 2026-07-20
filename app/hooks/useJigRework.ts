import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJigReworkAction, setJigReworkAction } from "@/actions/jig-rework";

/**
 * Hook to fetch rework status for all jigs, keyed by jig name
 */
export function useJigRework() {
  return useQuery({
    queryKey: ["jig-rework"],
    queryFn: async () => {
      const result = await getJigReworkAction();
      return result.reworkByJig;
    },
  });
}

/**
 * Hook to set the rework status for a jig
 */
export function useSetJigRework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jigName,
      isRework,
    }: {
      jigName: string;
      isRework: boolean;
    }) => setJigReworkAction(jigName, isRework),

    onSuccess: (_data, { jigName, isRework }) => {
      queryClient.setQueryData<Record<string, boolean>>(
        ["jig-rework"],
        (old = {}) => ({ ...old, [jigName]: isRework }),
      );
    },
  });
}
