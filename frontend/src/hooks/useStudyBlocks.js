import { useResourceItem, useResourceList, useResourceMutations } from './resource';

const RESOURCE = 'study-blocks';

// CRUD for /api/v1/study-blocks/.
//
// Usage:
//   const { studyBlocks, createStudyBlock, updateStudyBlock, deleteStudyBlock } = useStudyBlocks();
//   studyBlocks.data / studyBlocks.isPending / studyBlocks.error
//   useStudyBlocks({ project: 3, completed: false }) filters the list.
//   createStudyBlock.mutate({ project: 3, date: '2026-11-18', start_time: '09:00', end_time: '11:00' });
//   updateStudyBlock.mutate({ id, ...changedFields });   // PATCH
//   deleteStudyBlock.mutate(id);
export default function useStudyBlocks(params) {
    const studyBlocks = useResourceList(RESOURCE, params);
    const { create, update, remove } = useResourceMutations(RESOURCE);
    return {
        studyBlocks,
        createStudyBlock: create,
        updateStudyBlock: update,
        deleteStudyBlock: remove,
    };
}

// One record by id. Does not fetch while id is null or undefined.
export function useStudyBlock(id) {
    return useResourceItem(RESOURCE, id);
}
