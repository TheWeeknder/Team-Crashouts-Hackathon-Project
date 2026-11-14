// Types for useStudyBlocks.js, so TypeScript files can import it.
import type { UseQueryResult } from '@tanstack/react-query'
import type { ResourceMutations } from './resource'
import type { ApiError, StudyBlock, StudyBlockInput, StudyBlockListParams } from '../types/backend'

export default function useStudyBlocks(params?: StudyBlockListParams): {
  studyBlocks: UseQueryResult<StudyBlock[], ApiError>
  createStudyBlock: ResourceMutations<StudyBlock, StudyBlockInput>['create']
  updateStudyBlock: ResourceMutations<StudyBlock, StudyBlockInput>['update']
  deleteStudyBlock: ResourceMutations<StudyBlock, StudyBlockInput>['remove']
}

export function useStudyBlock(id: number | null | undefined): UseQueryResult<StudyBlock, ApiError>
