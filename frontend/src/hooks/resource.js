import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api/api';

// Shared TanStack Query helpers for the DRF ModelViewSets under /api/v1/.
// Each resource is named by its URL segment ('projects', 'study-blocks', ...),
// which is also the first part of its query keys:
//   [resource, 'list', params]   list results (one cache entry per filter)
//   [resource, 'detail', id]     one record

// Builds "?a=1&b=2" from a params object, skipping empty values.
export function toQueryString(params) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {})) {
        if (value === undefined || value === null || value === '') continue;
        // The backend filters with queryset.filter(field=value). Django's
        // BooleanField accepts "1"/"0" but not "true"/"false".
        search.set(
            key,
            typeof value === 'boolean' ? (value ? '1' : '0') : String(value),
        );
    }
    const text = search.toString();
    return text ? `?${text}` : '';
}

export function useResourceList(resource, params, options = {}) {
    return useQuery({
        queryKey: [resource, 'list', params ?? {}],
        queryFn: () => apiFetch(`${resource}/${toQueryString(params)}`),
        ...options,
    });
}

export function useResourceItem(resource, id) {
    return useQuery({
        queryKey: [resource, 'detail', id],
        queryFn: () => apiFetch(`${resource}/${id}/`),
        enabled: id !== null && id !== undefined,
    });
}

// create(data), update({ id, ...changes }) (PATCH) and remove(id).
// After each one, every list of this resource (and of `alsoInvalidate`,
// e.g. study blocks when a project is deleted) refetches. The mutation
// resolves after that refetch, so `await mutateAsync()` sees fresh lists.
export function useResourceMutations(resource, { alsoInvalidate = [] } = {}) {
    const queryClient = useQueryClient();

    const refresh = () =>
        Promise.all(
            [resource, ...alsoInvalidate].map((key) =>
                queryClient.invalidateQueries({ queryKey: [key, 'list'] }),
            ),
        );

    const saved = (item) => {
        queryClient.setQueryData([resource, 'detail', item.id], item);
        return refresh();
    };

    const create = useMutation({
        mutationFn: (data) =>
            apiFetch(`${resource}/`, { method: 'POST', body: data }),
        onSuccess: saved,
    });

    const update = useMutation({
        mutationFn: ({ id, ...changes }) =>
            apiFetch(`${resource}/${id}/`, { method: 'PATCH', body: changes }),
        onSuccess: saved,
    });

    const remove = useMutation({
        mutationFn: (id) => apiFetch(`${resource}/${id}/`, { method: 'DELETE' }),
        onSuccess: (_data, id) => {
            queryClient.removeQueries({ queryKey: [resource, 'detail', id] });
            if (alsoInvalidate.length) {
                // Related records may be gone too (CASCADE), so drop their
                // cached details as well.
                alsoInvalidate.forEach((key) =>
                    queryClient.removeQueries({ queryKey: [key, 'detail'] }),
                );
            }
            return refresh();
        },
    });

    return { create, update, remove };
}
