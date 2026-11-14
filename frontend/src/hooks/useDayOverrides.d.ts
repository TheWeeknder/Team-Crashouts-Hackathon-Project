// Types for useDayOverrides.js, so TypeScript files can import it.
import type { UseQueryResult } from '@tanstack/react-query'
import type { ResourceMutations } from './resource'
import type { ApiError, DayOverride, DayOverrideInput, DayOverrideListParams } from '../types/backend'

export default function useDayOverrides(params?: DayOverrideListParams): {
  dayOverrides: UseQueryResult<DayOverride[], ApiError>
  createDayOverride: ResourceMutations<DayOverride, DayOverrideInput>['create']
  updateDayOverride: ResourceMutations<DayOverride, DayOverrideInput>['update']
  deleteDayOverride: ResourceMutations<DayOverride, DayOverrideInput>['remove']
}

export function useDayOverride(id: number | null | undefined): UseQueryResult<DayOverride, ApiError>
