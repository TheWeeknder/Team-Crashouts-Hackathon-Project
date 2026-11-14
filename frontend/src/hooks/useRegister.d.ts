// Types for useRegister.js, so TypeScript files can import it.
import type { UseMutationResult } from '@tanstack/react-query'
import type { CurrentUser } from './useCurrentUser'

export interface RegisterInput {
  username: string
  email: string
  password: string
}

// ApiError from api.js. A network failure gives a plain Error with no status.
export interface RegisterError extends Error {
  status?: number
  // On a 400: field name -> list of messages, e.g. { email: ["..."] }.
  data?: unknown
}

export default function useRegister(): {
  register: UseMutationResult<CurrentUser, RegisterError, RegisterInput>
}
