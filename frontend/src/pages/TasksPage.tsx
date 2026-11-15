import { useState } from "react";

import ConfirmDialog from "../components/ConfirmDialog";
import Modal from "../components/Modal";
import LogHoursForm from "../components/forms/LogHoursForm";
import TaskForm from "../components/forms/TaskForm";
import usePlanStatus from "../hooks/usePlanStatus";
import useProjects from "../hooks/useProjects";
import { daysBetween, formatDate, relativeDays, todayISO } from "../lib/dates";
import { displayColour, isProjectOpen } from "../lib/events";
import { priorityLabel, statusLabel } from "../lib/taskOptions";
import type { Project } from "../types/backend";

type Filter = "active" | "done" | "all";
type Dialog =
  | { kind: "add" }
  | { kind: "edit"; project: Project }
  | { kind: "log"; project: Project }
  | { kind: "delete"; project: Project }
  | null;

const statusBadge: Record<string, string> = {
  incompleted: "badge-ghost",
  in_progress: "badge-info",
  completed: "badge-success",
  skipped: "badge-neutral",
};

function deadlineBadge(project: Project) {
  if (!project.deadline) return null;
  const days = daysBetween(todayISO(), project.deadline);
  const open = isProjectOpen(project);
  const tone = !open ? "badge-ghost" : days < 0 ? "badge-error" : days <= 3 ? "badge-warning" : "badge-ghost";
  const text = open && days < 0 ? `Overdue ${relativeDays(project.deadline).replace(" ago", "")}` : `Due ${relativeDays(project.deadline)}`;
  return <span className={`badge badge-sm ${tone}`}>{text}</span>;
}

export default function TasksPage() {
  const { projects, deleteProject } = useProjects();
  const { markStale } = usePlanStatus();
  const [filter, setFilter] = useState<Filter>("active");
  const [dialog, setDialog] = useState<Dialog>(null);

  const all = projects.data ?? [];
  const visible = all
    .filter((p) => (filter === "all" ? true : filter === "active" ? isProjectOpen(p) : !isProjectOpen(p)))
    // Tasks without a deadline go last.
    .sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"));
  const activeCount = all.filter(isProjectOpen).length;

  const close = () => {
    setDialog(null);
    deleteProject.reset();
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="mt-1 text-base-content/70">
            Assignments, projects and exam prep. The planner schedules study time for each one
            before its deadline.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setDialog({ kind: "add" })}>
          + Add task
        </button>
      </header>

      <div role="tablist" aria-label="Filter tasks" className="tabs tabs-box w-fit">
        {(
          [
            ["active", `Active (${activeCount})`],
            ["done", `Done (${all.length - activeCount})`],
            ["all", `All (${all.length})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            className={`tab ${filter === value ? "tab-active" : ""}`}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {projects.error && (
        <div role="alert" className="alert alert-error alert-soft">
          Could not load your tasks: {projects.error.message}
        </div>
      )}

      {projects.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-44 rounded-box" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="card border border-dashed border-base-300 bg-base-100/60">
          <div className="card-body items-center py-14 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-2xl text-primary" aria-hidden="true">
              ✎
            </span>
            <p className="mt-2 text-lg font-semibold">
              {filter === "done" ? "Nothing finished yet" : "No tasks yet"}
            </p>
            <p className="max-w-sm text-sm text-base-content/60">
              {filter === "done"
                ? "Tasks you complete or skip show up here."
                : "Add your first task with a deadline and an estimate, and the planner will find time for it."}
            </p>
            {filter !== "done" && (
              <button type="button" className="btn btn-primary btn-sm mt-3" onClick={() => setDialog({ kind: "add" })}>
                + Add task
              </button>
            )}
          </div>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => {
            const estimated = project.estimated_hours ?? 0;
            const done = project.completed_hours ?? 0;
            const percent = estimated > 0 ? Math.min(100, Math.round((done / estimated) * 100)) : 0;
            const colour = displayColour(project.colour);
            return (
              <li
                key={project.id}
                className="card border border-base-300 border-t-4 bg-base-100 shadow-sm transition hover:shadow-md"
                style={{ borderTopColor: colour }}
              >
                <div className="card-body gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="card-title text-lg leading-snug">{project.title}</h2>
                    <div className="dropdown dropdown-end">
                      <button
                        type="button"
                        tabIndex={0}
                        className="btn btn-ghost btn-sm btn-square"
                        aria-label={`Actions for ${project.title}`}
                      >
                        ⋯
                      </button>
                      <ul tabIndex={0} className="menu dropdown-content z-20 w-40 rounded-box bg-base-100 p-1 shadow-lg">
                        <li>
                          <button type="button" onClick={() => setDialog({ kind: "edit", project })}>
                            Edit
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="text-error"
                            onClick={() => setDialog({ kind: "delete", project })}
                          >
                            Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span className={`badge badge-sm ${statusBadge[project.status] ?? "badge-ghost"}`}>
                      {statusLabel(project.status)}
                    </span>
                    <span className="badge badge-sm badge-outline">{priorityLabel(project.priority)} priority</span>
                    {deadlineBadge(project)}
                  </div>

                  <p className="text-sm text-base-content/60">
                    {project.deadline ? `Deadline: ${formatDate(project.deadline)}` : "No deadline"}
                  </p>

                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-base-content/70">
                        {done} / {estimated} h
                      </span>
                      <span className="font-medium">{percent}%</span>
                    </div>
                    <progress
                      className="progress progress-primary h-2 w-full"
                      value={percent}
                      max={100}
                      aria-label={`${project.title}: ${percent}% complete`}
                    />
                  </div>

                  <div className="card-actions mt-1">
                    <button
                      type="button"
                      className="btn btn-sm btn-soft btn-primary flex-1"
                      onClick={() => setDialog({ kind: "log", project })}
                      disabled={!isProjectOpen(project)}
                    >
                      + Log hours
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => setDialog({ kind: "edit", project })}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={dialog?.kind === "add"} onClose={close} title="Add a task">
        <TaskForm onDone={close} />
      </Modal>

      <Modal open={dialog?.kind === "edit"} onClose={close} title="Edit task">
        {dialog?.kind === "edit" && <TaskForm project={dialog.project} onDone={close} />}
      </Modal>

      <Modal open={dialog?.kind === "log"} onClose={close} title="Log study hours">
        {dialog?.kind === "log" && <LogHoursForm project={dialog.project} onDone={close} />}
      </Modal>

      <ConfirmDialog
        open={dialog?.kind === "delete"}
        title="Delete this task?"
        message={
          dialog?.kind === "delete"
            ? `"${dialog.project.title}" and all of its study sessions will be deleted. This can't be undone.`
            : ""
        }
        isPending={deleteProject.isPending}
        error={deleteProject.error?.message}
        onClose={close}
        onConfirm={() => {
          if (dialog?.kind !== "delete") return;
          deleteProject.mutate(dialog.project.id, {
            onSuccess: () => {
              markStale();
              close();
            },
          });
        }}
      />
    </div>
  );
}
