import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, signInWithPassword } from '../api/api';
import { CURRENT_USER_KEY, removeAccountData } from './useCurrentUser';

// Usage:
//   const { register } = useRegister();
//   register.mutate({ username, email, password });
//   register.isPending / register.error / register.isSuccess
//
// Creates the account with POST accounts/ (sign-up needs no login), then
// logs in with the same username and password. On a 400, register.error.data
// holds the field errors from Django, e.g. { username: ["..."] }.
export default function useRegister() {
    const queryClient = useQueryClient();

    const register = useMutation({
        mutationFn: async ({ username, email, password }) => {
            // auth: false, so a stale saved login can not make sign-up fail.
            await apiFetch('accounts/', {
                method: 'POST',
                body: { username, email, password },
                auth: false,
            });
            return signInWithPassword(username, password);
        },
        onSuccess: (user) => {
            removeAccountData(queryClient);
            queryClient.setQueryData(CURRENT_USER_KEY, user);
        },
    });

    return { register };
}
