// Types for useWeeklySummary.js, so TypeScript files can import it.
import type { UseQueryResult } from '@tanstack/react-query'
import type { ISODate, WeeklySummary } from '../types/api'
import type { ApiError } from '../types/backend'

export default function useWeeklySummary(start?: ISODate): {
  summary: UseQueryResult<WeeklySummary, ApiError>
}
