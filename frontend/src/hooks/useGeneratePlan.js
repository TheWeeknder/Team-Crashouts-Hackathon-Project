import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api/api';

// Local wall-clock time like "2026-11-18T14:30". The server runs in UTC, so
// we send the browser's time to plan from the right "now".
function localNow() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
        `T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
}

// Usage:
//   const { generatePlan } = useGeneratePlan();
//   generatePlan.mutate();                    // build and save a new plan
//   generatePlan.mutate({ dry_run: true });   // preview, saves nothing
//   generatePlan.data?.alerts                 // projects that do not fit
//
// The server keeps completed blocks and blocks that already started, and
// replaces the rest. After a real run, study block lists refetch.
export default function useGeneratePlan() {
    const queryClient = useQueryClient();

    const generatePlan = useMutation({
        mutationFn: (options = {}) =>
            apiFetch('planner/generate/', {
                method: 'POST',
                body: { now: localNow(), ...options },
            }),
        onSuccess: (_plan, options) => {
            if (options?.dry_run) return undefined;
            queryClient.removeQueries({ queryKey: ['study-blocks', 'detail'] });
            return queryClient.invalidateQueries({ queryKey: ['study-blocks', 'list'] });
        },
    });

    return { generatePlan };
}
