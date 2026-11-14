// Types for resource.js, so TypeScript files can import it.
import type { UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query'
import type { ApiError } from '../types/backend'

export type ListParams = Record<string, string | number | boolean | null | undefined>

export interface ResourceMutations<T, Input> {
  create: UseMutationResult<T, ApiError, Input>
  // PATCH: send only the fields you want to change.
  update: UseMutationResult<T, ApiError, { id: number } & Partial<Input>>
  remove: UseMutationResult<null, ApiError, number>
}

export declare function toQueryString(params?: ListParams): string

export declare function useResourceList<T>(
  resource: string,
  params?: object,
  options?: Partial<UseQueryOptions<T[], ApiError>>,
): UseQueryResult<T[], ApiError>

export declare function useResourceItem<T>(
  resource: string,
  id: number | null | undefined,
): UseQueryResult<T, ApiError>

export declare function useResourceMutations<T, Input>(
  resource: string,
  options?: { alsoInvalidate?: string[] },
): ResourceMutations<T, Input>
