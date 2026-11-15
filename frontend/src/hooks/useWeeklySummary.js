import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/api';
import { localNow } from './useGeneratePlan';
import { toQueryString } from './resource';

// GET /api/v1/planner/week/: the WeeklySummary (types/api.ts) for
// ProgressTracker and the dashboard.
//
// Usage:
//   const { summary } = useWeeklySummary('2026-11-16');   // a Monday
//   <ProgressTracker summary={summary.data} />           // once loaded
//
// With no start, the server uses this week's Monday. Sends the browser's
// local time so "missed" blocks and at-risk projects use the right "now".
export default function useWeeklySummary(start) {
    const summary = useQuery({
        queryKey: ['planner', 'week', { start }],
        queryFn: () =>
            apiFetch(`planner/week/${toQueryString({ start, now: localNow() })}`),
    });
    return { summary };
}
