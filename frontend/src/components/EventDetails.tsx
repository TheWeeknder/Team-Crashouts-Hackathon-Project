import { useState } from "react";

import useProjects from "../hooks/useProjects";
import usePlanStatus from "../hooks/usePlanStatus";
import useStudyBlocks from "../hooks/useStudyBlocks";
import { blockHours } from "../lib/events";
import { nextProgress } from "../lib/progress";
import { priorityLabel, statusLabel } from "../lib/taskOptions";
import type { CalendarEvent } from "../types/api";
import type { Project, StudyBlock } from "../types/backend";

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const statusBadge: Record<string, string> = {
  done: "badge-success",
  planned: "badge-primary",
  missed: "badge-error",
};

const typeLabel = (event: CalendarEvent) =>
  event.type === "study"
    ? "Study session"
    : event.type === "deadline"
      ? "Deadline"
      : event.kind === "unavailable"
        ? "Time off"
        : "Commitment";

interface EventDetailsProps {
  event: CalendarEvent;
  projects: Project[];
  blocks: StudyBlock[];
}

// Details for one calendar event, plus "mark done" for study sessions.
export default function EventDetails({ event, projects, blocks }: EventDetailsProps) {
  const { updateStudyBlock } = useStudyBlocks();
  const { updateProject } = useProjects();
  const { markStale } = usePlanStatus();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const project = projects.find((p) => p.id === event.task_id) ?? null;
  const block =
    event.type === "study" ? (blocks.find((b) => b.id === event.record_id) ?? null) : null;

  async function toggleDone() {
    if (!block) return;
    setSaving(true);
    setError(null);
    const nowDone = !block.completed;
    try {
      await updateStudyBlock.mutateAsync({ id: block.id, completed: nowDone });
      if (project) {
        // Round first so "done" then "undo" always cancel out.
        const hours = Math.round(blockHours(block));
        await updateProject.mutateAsync({
          id: project.id,
          ...nextProgress(project, nowDone ? hours : -hours),
        });
      }
      markStale();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update this session.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <span className="badge badge-soft badge-sm">{typeLabel(event)}</span>
        <h3 className="mt-2 text-xl font-bold">{event.title}</h3>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
        {event.allDay ? (
          <>
            <dt className="text-base-content/60">Date</dt>
            <dd className="font-medium">{dateFormatter.format(new Date(event.start))}</dd>
          </>
        ) : (
          <>
            <dt className="text-base-content/60">Starts</dt>
            <dd className="font-medium">{dateTimeFormatter.format(new Date(event.start))}</dd>
            <dt className="text-base-content/60">Ends</dt>
            <dd className="font-medium">{dateTimeFormatter.format(new Date(event.end))}</dd>
          </>
        )}

        {event.type === "study" && (
          <>
            <dt className="text-base-content/60">Status</dt>
            <dd>
              <span className={`badge badge-sm ${statusBadge[event.status] ?? "badge-ghost"}`}>
                {event.status === "done" ? "Done" : event.status === "missed" ? "Missed" : "Planned"}
              </span>
            </dd>
          </>
        )}

        {project && (event.type === "study" || event.type === "deadline") && (
          <>
            <dt className="text-base-content/60">Task</dt>
            <dd className="font-medium">
              {project.completed_hours ?? 0} of {project.estimated_hours ?? 0} h done ·{" "}
              {statusLabel(project.status)} · {priorityLabel(project.priority)} priority
            </dd>
          </>
        )}
      </dl>

      {error && (
        <div role="alert" className="alert alert-error alert-soft text-sm">
          {error}
        </div>
      )}

      {block && (
        <div className="space-y-2">
          <button
            type="button"
            className={`btn w-full ${block.completed ? "btn-outline" : "btn-success"}`}
            onClick={toggleDone}
            disabled={saving}
          >
            {saving && <span className="loading loading-spinner loading-sm" />}
            {block.completed ? "Undo: mark as not done" : "Mark as done"}
          </button>
          {project && (
            <p className="text-center text-xs text-base-content/50">
              {block.completed ? "Removes" : "Adds"} {Math.round(blockHours(block))} h{" "}
              {block.completed ? "from" : "to"} {project.title} (whole hours only).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
