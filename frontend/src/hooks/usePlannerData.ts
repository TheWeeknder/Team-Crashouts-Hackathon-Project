import useCommitments from "./useCommitments";
import useDayOverrides from "./useDayOverrides";
import usePlannerSettings from "./usePlannerSettings";
import useProjects from "./useProjects";
import useStudyBlocks from "./useStudyBlocks";

// Everything the calendar and dashboard need, loaded together.
// Each list is [] until it arrives, so callers can use it straight away.
export default function usePlannerData() {
  const { projects } = useProjects();
  const { studyBlocks } = useStudyBlocks();
  const { commitments } = useCommitments();
  const { dayOverrides } = useDayOverrides();
  const { settings } = usePlannerSettings();

  const queries = [projects, studyBlocks, commitments, dayOverrides, settings];

  return {
    projects: projects.data ?? [],
    blocks: studyBlocks.data ?? [],
    commitments: commitments.data ?? [],
    overrides: dayOverrides.data ?? [],
    settings: settings.data ?? null,
    isLoading: queries.some((q) => q.isPending),
    error: queries.find((q) => q.error)?.error ?? null,
  };
}
