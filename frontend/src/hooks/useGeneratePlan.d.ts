// Types for useGeneratePlan.js, so TypeScript files can import it.
import type { UseMutationResult } from '@tanstack/react-query'
import type { ApiError, GeneratePlanInput, GeneratePlanResponse } from '../types/backend'

// The browser's time with its UTC offset, e.g. "2026-11-18T14:30-06:00".
export declare function localNow(): string

export default function useGeneratePlan(): {
  // mutate() with no argument builds and saves a plan.
  generatePlan: UseMutationResult<GeneratePlanResponse, ApiError, GeneratePlanInput | void>
}
