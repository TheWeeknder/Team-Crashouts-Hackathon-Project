import { useResourceItem, useResourceList, useResourceMutations } from './resource';

const RESOURCE = 'day-overrides';

// CRUD for /api/v1/day-overrides/.
//
// Usage:
//   const { dayOverrides, createDayOverride, updateDayOverride, deleteDayOverride } = useDayOverrides();
//   dayOverrides.data / dayOverrides.isPending / dayOverrides.error
//   useDayOverrides({ date: '2026-11-18' }) filters the list.
//   createDayOverride.mutate({ date: '2026-11-18', reason: 'low_energy', note: 'Rough night' });
//   updateDayOverride.mutate({ id, ...changedFields });   // PATCH
//   deleteDayOverride.mutate(id);
export default function useDayOverrides(params) {
    const dayOverrides = useResourceList(RESOURCE, params);
    const { create, update, remove } = useResourceMutations(RESOURCE);
    return {
        dayOverrides,
        createDayOverride: create,
        updateDayOverride: update,
        deleteDayOverride: remove,
    };
}

// One record by id. Does not fetch while id is null or undefined.
export function useDayOverride(id) {
    return useResourceItem(RESOURCE, id);
}
