import { useQuery } from '@tanstack/react-query';
import { apiFetch, getAuthHeader } from '../api/api';

export const CURRENT_USER_KEY = ['currentUser'];

// Drops every cached query except the current user, so data from one
// account never shows up for the next. The current-user query is kept (and
// updated with setQueryData) because components are subscribed to it.
export function removeAccountData(queryClient) {
    queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== CURRENT_USER_KEY[0],
    });
}

// The logged-in account, or null. On page load it re-checks the stored
// credentials against GET accounts/me/.
export default function useCurrentUser() {
    const hasAuth = getAuthHeader() !== null;

    const query = useQuery({
        queryKey: CURRENT_USER_KEY,
        queryFn: () => apiFetch('accounts/me/'),
        enabled: hasAuth,
        retry: false,
        staleTime: Infinity,
    });

    const user = hasAuth ? (query.data ?? null) : null;

    return {
        user,
        isLoggedIn: user !== null,
        isLoading: hasAuth && query.isPending,
        error: query.error,
    };
}
