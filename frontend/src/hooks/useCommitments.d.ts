// Types for useCommitments.js, so TypeScript files can import it.
import type { UseQueryResult } from '@tanstack/react-query'
import type { ResourceMutations } from './resource'
import type { ApiError, Commitment, CommitmentInput, CommitmentListParams } from '../types/backend'

export default function useCommitments(params?: CommitmentListParams): {
  commitments: UseQueryResult<Commitment[], ApiError>
  createCommitment: ResourceMutations<Commitment, CommitmentInput>['create']
  updateCommitment: ResourceMutations<Commitment, CommitmentInput>['update']
  deleteCommitment: ResourceMutations<Commitment, CommitmentInput>['remove']
}

export function useCommitment(id: number | null | undefined): UseQueryResult<Commitment, ApiError>
