import useCommitments from "./useCommitments";
import useDayOverrides from "./useDayOverrides";
import usePlannerSettings from "./usePlannerSettings";
import useProjects from "./useProjects";
import useStudyBlocks from "./useStudyBlocks";
import { addDays, todayISO } from "../lib/dates";

// The calendars show this many days back. Older study blocks are not
// downloaded, so the list does not grow without limit over a term.
export const DAYS_BACK = 120;

// Everything the calendar and dashboard need, loaded together.
// Each list is [] until it arrives, so callers can use it straight away.
export default function usePlannerData() {
  const { projects } = useProjects();
  // Same params on every page, so the pages share one cached list.
  const { studyBlocks } = useStudyBlocks({ date_from: addDays(todayISO(), -DAYS_BACK) });
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
