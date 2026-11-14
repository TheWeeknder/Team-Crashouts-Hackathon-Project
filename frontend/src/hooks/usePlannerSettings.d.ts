// Types for usePlannerSettings.js, so TypeScript files can import it.
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type { ApiError, PlannerSettings, PlannerSettingsInput } from '../types/backend'

export default function usePlannerSettings(): {
  // null until the user saves settings for the first time.
  settings: UseQueryResult<PlannerSettings | null, ApiError>
  saveSettings: UseMutationResult<PlannerSettings, ApiError, PlannerSettingsInput>
}
