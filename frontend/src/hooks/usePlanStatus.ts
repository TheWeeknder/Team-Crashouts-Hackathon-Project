import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import useCurrentUser from "./useCurrentUser";

// What the browser remembers about the saved study plan:
//   generatedAt  when the user last pressed Generate (null = never)
//   stale        true after the user changes tasks, commitments, time off
//                or settings, because the backend does not replan by itself
//
// Kept in the TanStack Query cache so every component sees the same value,
// and in localStorage (per account) so it survives a reload. The key is
// deliberately outside ['planner', ...]: resource.js refetches every
// ['planner'] query after each save, which would reset this state.
// Live shortfall alerts come from usePlanCheck instead.
export interface PlanStatus {
  generatedAt: string | null;
  stale: boolean;
}

const INITIAL: PlanStatus = { generatedAt: null, stale: false };

const storageKey = (userId: number | undefined) => `plan-status:${userId ?? "anon"}`;

function load(userId: number | undefined): PlanStatus {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return INITIAL;
    const parsed = JSON.parse(raw) as Partial<PlanStatus>;
    return {
      generatedAt: typeof parsed.generatedAt === "string" ? parsed.generatedAt : null,
      stale: parsed.stale === true,
    };
  } catch {
    return INITIAL;
  }
}

function save(userId: number | undefined, status: PlanStatus) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(status));
  } catch {
    // Storage blocked: the status lasts until reload only.
  }
}

export default function usePlanStatus() {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const userId = user?.id;
  const key = ["planStatus", userId ?? "anon"];

  const { data } = useQuery({
    queryKey: key,
    queryFn: () => load(userId),
    initialData: () => load(userId),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const update = useCallback(
    (next: (old: PlanStatus) => PlanStatus) => {
      const queryKey = ["planStatus", userId ?? "anon"];
      const value = next(queryClient.getQueryData<PlanStatus>(queryKey) ?? load(userId));
      queryClient.setQueryData(queryKey, value);
      save(userId, value);
    },
    [queryClient, userId],
  );

  const markStale = useCallback(() => update((old) => ({ ...old, stale: true })), [update]);

  const recordPlan = useCallback(
    () => update(() => ({ generatedAt: new Date().toISOString(), stale: false })),
    [update],
  );

  return { status: data, markStale, recordPlan };
}
