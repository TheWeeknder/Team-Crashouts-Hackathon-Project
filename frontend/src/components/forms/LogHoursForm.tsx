import { useId, useState, type FormEvent } from "react";

import useProjects from "../../hooks/useProjects";
import usePlanStatus from "../../hooks/usePlanStatus";
import { splitServerErrors } from "../../lib/formErrors";
import type { Project } from "../../types/backend";
import { Field, FormActions, FormError } from "./Field";

// Adds hours the user studied outside the plan to a task.
export default function LogHoursForm({ project, onDone }: { project: Project; onDone: () => void }) {
  const { updateProject } = useProjects();
  const { markStale } = usePlanStatus();
  const id = useId();
  const [hours, setHours] = useState("1");
  const [error, setError] = useState<string | null>(null);

  const server = splitServerErrors(updateProject.error, ["completed_hours"] as const);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const value = Number(hours);
    if (!hours || !Number.isFinite(value) || value <= 0) {
      setError("Enter the hours you studied, e.g. 1.5.");
      return;
    }
    setError(null);
    // Rounded to the backend's 2 decimals. The server sets the status from
    // the hours (ROADMAP B3.3).
    const completed = Math.round(((project.completed_hours ?? 0) + value) * 100) / 100;
    updateProject.mutate(
      { id: project.id, completed_hours: completed },
      {
        onSuccess: () => {
          markStale();
          onDone();
        },
      },
    );
  }

  const done = project.completed_hours ?? 0;
  const estimated = project.estimated_hours ?? 0;

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
      <p className="text-sm text-base-content/70">
        <strong>{project.title}</strong>: {done} of {estimated} hours done so far.
      </p>
      <Field
        label="Hours studied"
        htmlFor={`${id}-hours`}
        error={error ?? server.fields.completed_hours}
        hint="Fractions are fine, e.g. 0.75 for 45 minutes."
      >
        <input
          id={`${id}-hours`}
          type="number"
          min={0.25}
          step={0.25}
          inputMode="decimal"
          className={`input w-full ${error ? "input-error" : ""}`}
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          disabled={updateProject.isPending}
          autoFocus
        />
      </Field>
      <FormError message={server.general} />
      <FormActions
        onCancel={onDone}
        isPending={updateProject.isPending}
        submitLabel="Log hours"
        pendingLabel="Saving…"
      />
    </form>
  );
}
