import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signInWithPassword } from '../api/api';
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
        // signInWithPassword stores the auth header itself, so the
        // credentials never end up in the mutation's data.
        mutationFn: ({ username, password }) =>
            signInWithPassword(username, password),
        onSuccess: (user) => {
            removeAccountData(queryClient);
            queryClient.setQueryData(CURRENT_USER_KEY, user);
        },
    });

    return { login };
}
