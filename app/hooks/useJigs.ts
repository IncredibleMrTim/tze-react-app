import { useQuery } from "@tanstack/react-query";
import { getJigsAction } from "@/actions/jigs";
import type { IJig } from "@/types/interfaces";

/**
 * Hook to fetch the fixed list of physical jig slots (auto-provisioned
 * server-side to match settings.jigCount), each with a stable id.
 */
export function useJigs() {
  return useQuery({
    queryKey: ["jigs"],
    queryFn: async (): Promise<IJig[]> => {
      const result = await getJigsAction();
      return result.jigs;
    },
  });
}
