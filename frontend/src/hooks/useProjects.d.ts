// Types for useProjects.js, so TypeScript files can import it.
import type { UseQueryResult } from '@tanstack/react-query'
import type { ResourceMutations } from './resource'
import type { ApiError, Project, ProjectInput, ProjectListParams } from '../types/backend'

export default function useProjects(params?: ProjectListParams): {
  projects: UseQueryResult<Project[], ApiError>
  createProject: ResourceMutations<Project, ProjectInput>['create']
  updateProject: ResourceMutations<Project, ProjectInput>['update']
  deleteProject: ResourceMutations<Project, ProjectInput>['remove']
}

export function useProject(id: number | null | undefined): UseQueryResult<Project, ApiError>
