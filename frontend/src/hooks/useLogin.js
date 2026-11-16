import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signInWithPassword } from '../api/api';
import { CURRENT_USER_KEY, removeAccountData } from './useCurrentUser';

// Usage:
//   const { login } = useLogin();
//   login.mutate({ username, password });
//   login.isPending / login.error?.message / login.isSuccess
//
// POST auth/login/ checks the password once and returns a token, which is
// kept for later requests (see api.js).
export default function useLogin() {
    const queryClient = useQueryClient();

    const login = useMutation({
        // signInWithPassword stores the token itself, so the credentials
        // never end up in the mutation's data.
        mutationFn: ({ username, password }) =>
            signInWithPassword(username, password),
        onSuccess: (user) => {
            removeAccountData(queryClient);
            queryClient.setQueryData(CURRENT_USER_KEY, user);
        },
    });

    return { login };
}
