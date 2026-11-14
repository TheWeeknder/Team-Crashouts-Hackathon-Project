// Types for useCurrentUser.js, so TypeScript files can import it.
import type { QueryClient } from '@tanstack/react-query'

// Fields from GET /api/v1/accounts/me/ that the frontend uses.
export interface CurrentUser {
  id: number
  username: string
  email: string
  first_name: string | null
  last_name: string | null
}

export declare const CURRENT_USER_KEY: readonly ['currentUser']

export declare function removeAccountData(queryClient: QueryClient): void

export default function useCurrentUser(): {
  user: CurrentUser | null
  isLoggedIn: boolean
  isLoading: boolean
  error: Error | null
}
