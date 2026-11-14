// Types for useGeneratePlan.js, so TypeScript files can import it.
import type { UseMutationResult } from '@tanstack/react-query'
import type { ApiError, GeneratePlanInput, GeneratePlanResponse } from '../types/backend'

export default function useGeneratePlan(): {
  // mutate() with no argument builds and saves a plan.
  generatePlan: UseMutationResult<GeneratePlanResponse, ApiError, GeneratePlanInput | void>
}
