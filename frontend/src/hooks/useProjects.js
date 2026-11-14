import { useResourceItem, useResourceList, useResourceMutations } from './resource';

const RESOURCE = 'projects';

// CRUD for /api/v1/projects/.
//
// Usage:
//   const { projects, createProject, updateProject, deleteProject } = useProjects();
//   projects.data / projects.isPending / projects.error
//   useProjects({ status: 'in_progress', ordering: 'deadline' }) filters the list.
//   createProject.mutate({ title: 'Capstone report', deadline: '2026-11-21', estimated_hours: 10 });
//   updateProject.mutate({ id, ...changedFields });   // PATCH
//   deleteProject.mutate(id);
//
// Deleting a project also deletes its study blocks (CASCADE), so study block
// lists refetch too.
export default function useProjects(params) {
    const projects = useResourceList(RESOURCE, params);
    const { create, update, remove } = useResourceMutations(RESOURCE, { alsoInvalidate: ['study-blocks'] });
    return {
        projects,
        createProject: create,
        updateProject: update,
        deleteProject: remove,
    };
}

// One record by id. Does not fetch while id is null or undefined.
export function useProject(id) {
    return useResourceItem(RESOURCE, id);
}
