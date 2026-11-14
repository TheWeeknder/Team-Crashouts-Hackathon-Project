import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { clearAuthHeader } from '../api/api';
import { CURRENT_USER_KEY, removeAccountData } from './useCurrentUser';

// Usage: const logout = useLogout(); <button onClick={logout}>Log out</button>
export default function useLogout() {
    const queryClient = useQueryClient();

    return useCallback(() => {
        clearAuthHeader();
        queryClient.setQueryData(CURRENT_USER_KEY, null);
        removeAccountData(queryClient);
    }, [queryClient]);
}
