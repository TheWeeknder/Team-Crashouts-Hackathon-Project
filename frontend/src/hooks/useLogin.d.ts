// Types for useLogin.js, so TypeScript files can import it.
import type { UseMutationResult } from '@tanstack/react-query'
import type { CurrentUser } from './useCurrentUser'

export interface LoginCredentials {
  username: string
  password: string
}

export default function useLogin(): {
  login: UseMutationResult<CurrentUser, Error, LoginCredentials>
}
