import type { Project, ProjectStatus } from "../types/backend";

// New completed_hours and status after adding (or, with a negative number,
// removing) study hours. The backend stores hours with 2 decimals and does
// not update the status itself (ROADMAP B3.3), so the frontend does both.
export function nextProgress(
  project: Project,
  deltaHours: number,
): { completed_hours: number; status: ProjectStatus } {
  const estimated = project.estimated_hours ?? 0;
  // Round to 2 decimals, the backend's precision (a 45-minute block adds 0.75).
  const completed = Math.max(0, Math.round(((project.completed_hours ?? 0) + deltaHours) * 100) / 100);
  let status = project.status;
  if (status !== "skipped") {
    if (estimated > 0 && completed >= estimated) status = "completed";
    else if (completed > 0) status = "in_progress";
    else if (status === "completed") status = "in_progress";
  }
  return { completed_hours: completed, status };
}
