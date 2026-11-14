import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api/api';
import { useResourceList } from './resource';

const RESOURCE = 'planner-settings';
const LIST_KEY = [RESOURCE, 'list', {}];

// The user's planner settings (one record per user).
//
// Usage:
//   const { settings, saveSettings } = usePlannerSettings();
//   settings.data          // PlannerSettings, or null if none saved yet
//   saveSettings.mutate({ day_start_time: '09:00', max_hours_per_day: 6 });
//
// The backend exposes settings as a normal list, and a new account has none.
// saveSettings creates the record the first time and PATCHes it after that.
export default function usePlannerSettings() {
    const queryClient = useQueryClient();

    const settings = useResourceList(RESOURCE, undefined, {
        select: (rows) => rows[0] ?? null,
    });

    const saveSettings = useMutation({
        mutationFn: async (changes) => {
            // Read the cache at call time, not from this render, so two quick
            // saves do not both create a record.
            const rows =
                queryClient.getQueryData(LIST_KEY) ??
                (await queryClient.fetchQuery({
                    queryKey: LIST_KEY,
                    queryFn: () => apiFetch(`${RESOURCE}/`),
                }));
            const existing = rows[0];
            return existing
                ? apiFetch(`${RESOURCE}/${existing.id}/`, {
                      method: 'PATCH',
                      body: changes,
                  })
                : apiFetch(`${RESOURCE}/`, { method: 'POST', body: changes });
        },
        onSuccess: (saved) => {
            queryClient.setQueryData(LIST_KEY, [saved]);
        },
    });

    return { settings, saveSettings };
}
