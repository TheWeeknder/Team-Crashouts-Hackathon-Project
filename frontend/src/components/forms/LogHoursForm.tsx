import { useId, useState, type FormEvent } from "react";

import useProjects from "../../hooks/useProjects";
import usePlanStatus from "../../hooks/usePlanStatus";
import { splitServerErrors } from "../../lib/formErrors";
import { nextProgress } from "../../lib/progress";
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
    if (!Number.isInteger(value) || value < 1) {
      setError("Enter a whole number of hours (1 or more).");
      return;
    }
    setError(null);
    updateProject.mutate(
      { id: project.id, ...nextProgress(project, value) },
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
        hint="The planner only stores whole hours."
      >
        <input
          id={`${id}-hours`}
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
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
