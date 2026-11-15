import { useId, useState, type FormEvent } from "react";

import useCommitments from "../../hooks/useCommitments";
import usePlanStatus from "../../hooks/usePlanStatus";
import {
  formatWeekdays,
  fromTimeInput,
  parseWeekdays,
  timeToMinutes,
  toTimeInput,
  todayISO,
} from "../../lib/dates";
import { splitServerErrors } from "../../lib/formErrors";
import type { Commitment } from "../../types/backend";
import { Field, FormActions, FormError, WeekdayPicker } from "./Field";

const FIELDS = [
  "title",
  "weekdays",
  "date",
  "start_time",
  "end_time",
  "active_from",
  "active_to",
] as const;
type FieldName = (typeof FIELDS)[number];

interface CommitmentFormProps {
  commitment?: Commitment;
  onDone: () => void;
}

// Work shifts, classes, practice... anything the planner must avoid.
// Either one date, or a weekly repeat on chosen weekdays.
export default function CommitmentForm({ commitment, onDone }: CommitmentFormProps) {
  const { createCommitment, updateCommitment } = useCommitments();
  const { markStale } = usePlanStatus();
  const mutation = commitment ? updateCommitment : createCommitment;
  const id = useId();

  const [title, setTitle] = useState(commitment?.title ?? "");
  const [repeats, setRepeats] = useState(commitment ? !!commitment.recuring : true);
  const [weekdays, setWeekdays] = useState<number[]>(parseWeekdays(commitment?.weekdays));
  const [date, setDate] = useState(commitment?.date ?? todayISO());
  const [start, setStart] = useState(toTimeInput(commitment?.start_time) || "09:00");
  const [end, setEnd] = useState(toTimeInput(commitment?.end_time) || "17:00");
  const [activeFrom, setActiveFrom] = useState(commitment?.active_from ?? "");
  const [activeTo, setActiveTo] = useState(commitment?.active_to ?? "");
  const [clientErrors, setClientErrors] = useState<Partial<Record<FieldName, string>>>({});

  const server = splitServerErrors(mutation.error, FIELDS);
  const errorFor = (field: FieldName) => clientErrors[field] ?? server.fields[field];

  function validate() {
    const errors: Partial<Record<FieldName, string>> = {};
    if (!title.trim()) errors.title = "Give it a name, e.g. Work shift.";
    if (repeats && weekdays.length === 0) errors.weekdays = "Pick at least one day.";
    if (!repeats && !date) errors.date = "Pick a date.";
    if (!start) errors.start_time = "Pick a start time.";
    if (!end) errors.end_time = "Pick an end time.";
    if (start && end && timeToMinutes(end) <= timeToMinutes(start)) {
      errors.end_time = "End must be after start (same day).";
    }
    if (repeats && activeFrom && activeTo && activeTo < activeFrom) {
      errors.active_to = "Must be on or after the start date.";
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
      recuring: repeats,
      weekdays: repeats ? formatWeekdays(weekdays) : "",
      date: repeats ? null : date,
      start_time: fromTimeInput(start),
      end_time: fromTimeInput(end),
      active_from: repeats ? activeFrom || null : null,
      active_to: repeats ? activeTo || null : null,
    };
    const options = {
      onSuccess: () => {
        markStale();
        onDone();
      },
    };
    if (commitment) updateCommitment.mutate({ id: commitment.id, ...body }, options);
    else createCommitment.mutate(body, options);
  }

  const pending = mutation.isPending;

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
      <Field
        label="Name"
        htmlFor={`${id}-title`}
        error={errorFor("title")}
        errorId={`${id}-title-error`}
      >
        <input
          id={`${id}-title`}
          className={`input w-full ${errorFor("title") ? "input-error" : ""}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Work shift, Basketball practice"
          disabled={pending}
          aria-invalid={!!errorFor("title") || undefined}
          aria-describedby={errorFor("title") ? `${id}-title-error` : undefined}
          autoFocus
        />
      </Field>

      <div role="radiogroup" aria-label="How often" className="join w-full">
        {[
          { value: true, label: "Every week" },
          { value: false, label: "One time" },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={repeats === option.value}
            className={`btn join-item flex-1 ${repeats === option.value ? "btn-primary" : ""}`}
            onClick={() => setRepeats(option.value)}
            disabled={pending}
          >
            {option.label}
          </button>
        ))}
      </div>

      {repeats ? (
        <Field label="On these days" error={errorFor("weekdays")}>
          <WeekdayPicker
            value={weekdays}
            onChange={setWeekdays}
            disabled={pending}
            invalid={!!errorFor("weekdays")}
          />
        </Field>
      ) : (
        <Field label="Date" htmlFor={`${id}-date`} error={errorFor("date")}>
          <input
            id={`${id}-date`}
            type="date"
            className={`input w-full ${errorFor("date") ? "input-error" : ""}`}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={pending}
          />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Starts" htmlFor={`${id}-start`} error={errorFor("start_time")}>
          <input
            id={`${id}-start`}
            type="time"
            className={`input w-full ${errorFor("start_time") ? "input-error" : ""}`}
            value={start}
            onChange={(e) => setStart(e.target.value)}
            disabled={pending}
          />
        </Field>
        <Field label="Ends" htmlFor={`${id}-end`} error={errorFor("end_time")}>
          <input
            id={`${id}-end`}
            type="time"
            className={`input w-full ${errorFor("end_time") ? "input-error" : ""}`}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            disabled={pending}
          />
        </Field>
      </div>

      {repeats && (
        <details className="collapse-arrow collapse rounded-box border border-base-300">
          <summary className="collapse-title text-sm font-medium">
            Only for part of the year (optional)
          </summary>
          <div className="collapse-content grid grid-cols-2 gap-3">
            <Field label="From" htmlFor={`${id}-from`} error={errorFor("active_from")}>
              <input
                id={`${id}-from`}
                type="date"
                className="input w-full"
                value={activeFrom}
                onChange={(e) => setActiveFrom(e.target.value)}
                disabled={pending}
              />
            </Field>
            <Field label="Until" htmlFor={`${id}-to`} error={errorFor("active_to")}>
              <input
                id={`${id}-to`}
                type="date"
                className={`input w-full ${errorFor("active_to") ? "input-error" : ""}`}
                value={activeTo}
                onChange={(e) => setActiveTo(e.target.value)}
                disabled={pending}
              />
            </Field>
          </div>
        </details>
      )}

      <FormError message={server.general} />

      <FormActions
        onCancel={onDone}
        isPending={pending}
        submitLabel={commitment ? "Save changes" : "Add commitment"}
        pendingLabel="Saving…"
      />
    </form>
  );
}
