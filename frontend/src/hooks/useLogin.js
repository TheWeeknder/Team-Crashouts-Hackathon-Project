import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, basicAuthHeader, setAuthHeader } from '../api/api';
import { CURRENT_USER_KEY, removeAccountData } from './useCurrentUser';

// Usage:
//   const { login } = useLogin();
//   login.mutate({ username, password });
//   login.isPending / login.error?.message / login.isSuccess
//
// The backend has no login endpoint (it uses BasicAuthentication), so we
// "log in" by calling GET accounts/me/ with the credentials. A 200 means they
// are valid; then we keep the header for later requests.
export default function useLogin() {
    const queryClient = useQueryClient();

    const login = useMutation({
        mutationFn: async ({ username, password }) => {
            const authorization = basicAuthHeader(username, password);
            const user = await apiFetch('accounts/me/', {
                headers: { Authorization: authorization },
            });
            // Store here, not in onSuccess, so the credentials never end up
            // in the mutation's data.
            setAuthHeader(authorization);
            return user;
        },
        onSuccess: (user) => {
            removeAccountData(queryClient);
            queryClient.setQueryData(CURRENT_USER_KEY, user);
        },
    });

    return { login };
}
