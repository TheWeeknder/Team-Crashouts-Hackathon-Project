import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { GeneratePlanResponse, PlanAlert } from "../types/backend";

// Client-side state about the study plan, kept in the TanStack Query cache
// so every page sees the same value (and logout clears it):
//   alerts       from the last "Generate plan"
//   generatedAt  when that was
//   stale        true after the user changes tasks, commitments, time off
//                or settings, because the backend does not replan by itself
export interface PlanStatus {
  alerts: PlanAlert[];
  generatedAt: string | null;
  stale: boolean;
}

const KEY = ["planner", "status"];
const INITIAL: PlanStatus = { alerts: [], generatedAt: null, stale: false };

export default function usePlanStatus() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: KEY,
    queryFn: () => INITIAL,
    initialData: INITIAL,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const markStale = useCallback(() => {
    queryClient.setQueryData<PlanStatus>(KEY, (old) => ({ ...(old ?? INITIAL), stale: true }));
  }, [queryClient]);

  const recordPlan = useCallback(
    (plan: GeneratePlanResponse) => {
      queryClient.setQueryData<PlanStatus>(KEY, {
        alerts: plan.alerts,
        generatedAt: new Date().toISOString(),
        stale: false,
      });
    },
    [queryClient],
  );

  return { status: data, markStale, recordPlan };
}
