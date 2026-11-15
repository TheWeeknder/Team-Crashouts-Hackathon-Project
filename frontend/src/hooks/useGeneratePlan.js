import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api/api';

// The browser's time with its UTC offset, e.g. "2026-11-18T14:30-06:00".
// The server converts it to its own time zone (America/Edmonton), the zone
// study blocks are stored in, so "now" is right even if this browser is in
// another time zone.
export function localNow() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const offset = -d.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const abs = Math.abs(offset);
    return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
        `T${pad(d.getHours())}:${pad(d.getMinutes())}` +
        `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
    );
}

// Usage:
//   const { generatePlan } = useGeneratePlan();
//   generatePlan.mutate();                    // build and save a new plan
//   generatePlan.mutate({ dry_run: true });   // preview, saves nothing
//   generatePlan.data?.alerts                 // projects that do not fit
//
// The server keeps completed blocks and blocks that already started, and
// replaces the rest. After a real run, study block lists and planner views refetch.
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
            return Promise.all([
                queryClient.invalidateQueries({ queryKey: ['study-blocks', 'list'] }),
                queryClient.invalidateQueries({ queryKey: ['planner'] }),
            ]);
        },
    });

    return { generatePlan };
}
