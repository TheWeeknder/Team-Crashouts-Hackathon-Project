// Types for api.js, so TypeScript files can import it.

export declare const api_url: string

export declare function getAuthHeader(): string | null
export declare function setAuthHeader(value: string): void
export declare function clearAuthHeader(): void

export declare class ApiError extends Error {
  constructor(status: number, data: unknown)
  status: number
  data: unknown
}

export interface ApiFetchOptions extends Omit<RequestInit, 'body' | 'headers'> {
  headers?: Record<string, string>
  // Sent as JSON.
  body?: unknown
  // false: do not send the stored Authorization header.
  auth?: boolean
}

// fetch wrapper: prefixes api_url, sends JSON, adds the stored auth header
// and throws ApiError on non-2xx responses.
export declare function apiFetch<T = unknown>(path: string, options?: ApiFetchOptions): Promise<T>

export declare function signInWithPassword(username: string, password: string): Promise<unknown>
export declare function signOut(): void
