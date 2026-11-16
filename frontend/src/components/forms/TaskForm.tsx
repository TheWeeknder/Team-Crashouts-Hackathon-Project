import { useId, useState, type FormEvent } from "react";

import useProjects from "../../hooks/useProjects";
import usePlanStatus from "../../hooks/usePlanStatus";
import { DEFAULT_PROJECT_COLOUR } from "../../lib/events";
import { splitServerErrors } from "../../lib/formErrors";
import { COLOUR_OPTIONS, PRIORITY_OPTIONS, STATUS_OPTIONS, nearestPriority } from "../../lib/taskOptions";
import type { Project, ProjectColour, ProjectStatus } from "../../types/backend";
import { Field, FormActions, FormError } from "./Field";

const FIELDS = [
  "title",
  "deadline",
  "estimated_hours",
  "completed_hours",
  "priority",
  "status",
  "colour",
] as const;
type FieldName = (typeof FIELDS)[number];

interface TaskFormProps {
  // Edit this project; omit to create a new one.
  project?: Project;
  onDone: () => void;
}

export default function TaskForm({ project, onDone }: TaskFormProps) {
  const { createProject, updateProject } = useProjects();
  const { markStale } = usePlanStatus();
  const mutation = project ? updateProject : createProject;
  const id = useId();

  const [title, setTitle] = useState(project?.title ?? "");
  const [deadline, setDeadline] = useState(project?.deadline ?? "");
  const [estimated, setEstimated] = useState(String(project?.estimated_hours ?? ""));
  const [completed, setCompleted] = useState(String(project?.completed_hours ?? 0));
  const [priority, setPriority] = useState(nearestPriority(project?.priority).value);
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "incompleted");
  const [colour, setColour] = useState<ProjectColour>(
    project?.colour && project.colour !== "#FFFFFF"
      ? project.colour
      : (DEFAULT_PROJECT_COLOUR as ProjectColour),
  );
  const [clientErrors, setClientErrors] = useState<Partial<Record<FieldName, string>>>({});

  const server = splitServerErrors(mutation.error, FIELDS);
  const errorFor = (field: FieldName) => clientErrors[field] ?? server.fields[field];

  function validate() {
    const errors: Partial<Record<FieldName, string>> = {};
    if (!title.trim()) errors.title = "Give the task a name.";
    const est = Number(estimated);
    if (!estimated || !Number.isFinite(est) || est <= 0) {
      errors.estimated_hours = "Enter the hours the task needs, e.g. 10 or 2.5.";
    }
    const done = Number(completed);
    if (project && (completed === "" || !Number.isFinite(done) || done < 0)) {
      errors.completed_hours = "Enter the hours done so far (0 or more).";
    }
    return errors;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const errors = validate();
    setClientErrors(errors);
    if (Object.keys(errors).length) return;

    const body = {
      title: title.trim(),
      deadline: deadline || null,
      estimated_hours: Number(estimated),
      priority,
      colour,
      status,
      ...(project ? { completed_hours: Number(completed) } : { completed_hours: 0 }),
    };
    const options = {
      onSuccess: () => {
        markStale();
        onDone();
      },
    };
    if (project) updateProject.mutate({ id: project.id, ...body }, options);
    else createProject.mutate(body, options);
  }

  const pending = mutation.isPending;
  const describedBy = (field: FieldName) => (errorFor(field) ? `${id}-${field}-error` : undefined);

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
      <Field
        label="Task name"
        htmlFor={`${id}-title`}
        error={errorFor("title")}
        errorId={`${id}-title-error`}
      >
        <input
          id={`${id}-title`}
          className={`input w-full ${errorFor("title") ? "input-error" : ""}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Capstone report"
          disabled={pending}
          aria-invalid={!!errorFor("title") || undefined}
          aria-describedby={describedBy("title")}
          autoFocus
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Deadline"
          htmlFor={`${id}-deadline`}
          error={errorFor("deadline")}
          errorId={`${id}-deadline-error`}
          hint="Optional. Due at the end of this day."
        >
          <input
            id={`${id}-deadline`}
            type="date"
            className={`input w-full ${errorFor("deadline") ? "input-error" : ""}`}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            disabled={pending}
            aria-describedby={describedBy("deadline")}
          />
        </Field>

        <Field
          label="Estimated hours"
          htmlFor={`${id}-estimated`}
          error={errorFor("estimated_hours")}
          errorId={`${id}-estimated_hours-error`}
          hint="Total time the task needs."
        >
          <input
            id={`${id}-estimated`}
            type="number"
            inputMode="decimal"
            min={0.25}
            step={0.25}
            className={`input w-full ${errorFor("estimated_hours") ? "input-error" : ""}`}
            value={estimated}
            onChange={(e) => setEstimated(e.target.value)}
            placeholder="e.g. 10"
            disabled={pending}
            aria-invalid={!!errorFor("estimated_hours") || undefined}
            aria-describedby={describedBy("estimated_hours")}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Priority" htmlFor={`${id}-priority`} error={errorFor("priority")}>
          <select
            id={`${id}-priority`}
            className="select w-full"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            disabled={pending}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status" htmlFor={`${id}-status`} error={errorFor("status")}>
          <select
            id={`${id}-status`}
            className="select w-full"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            disabled={pending}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {project && (
        <Field
          label="Hours completed"
          htmlFor={`${id}-completed`}
          error={errorFor("completed_hours")}
          errorId={`${id}-completed_hours-error`}
        >
          <input
            id={`${id}-completed`}
            type="number"
            inputMode="decimal"
            min={0}
            step={0.25}
            className={`input w-full ${errorFor("completed_hours") ? "input-error" : ""}`}
            value={completed}
            onChange={(e) => setCompleted(e.target.value)}
            disabled={pending}
            aria-describedby={describedBy("completed_hours")}
          />
        </Field>
      )}

      <Field label="Colour" error={errorFor("colour")}>
        <div role="radiogroup" aria-label="Colour" className="flex flex-wrap gap-2">
          {COLOUR_OPTIONS.map((option) => {
            const selected = option.value === colour;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={option.label}
                title={option.label}
                disabled={pending}
                onClick={() => setColour(option.value)}
                className={`size-8 rounded-full border border-base-content/10 transition ${
                  selected
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-base-100"
                    : "hover:scale-110"
                }`}
                style={{ backgroundColor: option.value }}
              />
            );
          })}
        </div>
      </Field>

      <FormError message={server.general} />

      <FormActions
        onCancel={onDone}
        isPending={pending}
        submitLabel={project ? "Save changes" : "Add task"}
        pendingLabel="Saving…"
      />
    </form>
  );
}
