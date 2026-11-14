import { useResourceItem, useResourceList, useResourceMutations } from './resource';

const RESOURCE = 'commitments';

// CRUD for /api/v1/commitments/.
//
// Usage:
//   const { commitments, createCommitment, updateCommitment, deleteCommitment } = useCommitments();
//   commitments.data / commitments.isPending / commitments.error
//   useCommitments({ date: '2026-11-18' }) filters the list.
//   createCommitment.mutate({ title: 'Work shift', recuring: true, weekdays: '1,3', start_time: '13:00', end_time: '19:00' });
//   updateCommitment.mutate({ id, ...changedFields });   // PATCH
//   deleteCommitment.mutate(id);
export default function useCommitments(params) {
    const commitments = useResourceList(RESOURCE, params);
    const { create, update, remove } = useResourceMutations(RESOURCE);
    return {
        commitments,
        createCommitment: create,
        updateCommitment: update,
        deleteCommitment: remove,
    };
}

// One record by id. Does not fetch while id is null or undefined.
export function useCommitment(id) {
    return useResourceItem(RESOURCE, id);
}
