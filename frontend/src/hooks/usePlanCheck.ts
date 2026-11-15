import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../api/api";
import { localNow } from "./useGeneratePlan";
import type { ApiError, GeneratePlanResponse } from "../types/backend";

export const PLAN_CHECK_KEY = ["planner", "check"];

export function fetchPlanCheck(): Promise<GeneratePlanResponse> {
  return apiFetch<GeneratePlanResponse>("planner/generate/", {
    method: "POST",
    body: { now: localNow(), dry_run: true },
  });
}

// Live feasibility check: runs the planner as a dry run (saves nothing) and
// returns its alerts, i.e. which tasks no longer fit before their deadline
// with the current tasks, commitments, time off and settings.
//
// It loads with the page, so alerts survive a reload. The key sits under
// ['planner'], so resource.js and useGeneratePlan refetch it after every
// save and every generate.
export default function usePlanCheck({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery<GeneratePlanResponse, ApiError>({
    queryKey: PLAN_CHECK_KEY,
    queryFn: fetchPlanCheck,
    enabled,
    staleTime: 30_000,
  });
}
