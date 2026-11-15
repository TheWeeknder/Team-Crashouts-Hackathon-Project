import { useId, useState, type FormEvent } from "react";

import useDayOverrides from "../../hooks/useDayOverrides";
import useGeneratePlan from "../../hooks/useGeneratePlan";
import usePlanStatus from "../../hooks/usePlanStatus";
import { fromTimeInput, timeToMinutes, toTimeInput, todayISO } from "../../lib/dates";
import { splitServerErrors } from "../../lib/formErrors";
import { REASON_OPTIONS } from "../../lib/taskOptions";
import type { DayOverride } from "../../types/backend";
import { Field, FormActions, FormError } from "./Field";

const FIELDS = ["date", "start_time", "end_time", "reason", "note"] as const;
type FieldName = (typeof FIELDS)[number];

interface DayOverrideFormProps {
  override?: DayOverride;
  // Pre-fill the date (e.g. "today" from the dashboard).
  defaultDate?: string;
  onDone: () => void;
}

// "Life happens": time you can't study. Whole day or a time range.
// By default it also rebuilds the plan straight away.
export default function DayOverrideForm({ override, defaultDate, onDone }: DayOverrideFormProps) {
  const { createDayOverride, updateDayOverride } = useDayOverrides();
  const { generatePlan } = useGeneratePlan();
  const { markStale, recordPlan } = usePlanStatus();
  const mutation = override ? updateDayOverride : createDayOverride;
  const id = useId();

  const [date, setDate] = useState(override?.date ?? defaultDate ?? todayISO());
  const [wholeDay, setWholeDay] = useState(override ? !override.start_time && !override.end_time : true);
  const [start, setStart] = useState(toTimeInput(override?.start_time) || "12:00");
  const [end, setEnd] = useState(toTimeInput(override?.end_time) || "17:00");
  const [reason, setReason] = useState(override?.reason || "low_energy");
  const [note, setNote] = useState(override?.note ?? "");
  const [replan, setReplan] = useState(true);
  const [clientErrors, setClientErrors] = useState<Partial<Record<FieldName, string>>>({});

  const server = splitServerErrors(mutation.error ?? generatePlan.error, FIELDS);
  const errorFor = (field: FieldName) => clientErrors[field] ?? server.fields[field];

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const errors: Partial<Record<FieldName, string>> = {};
    if (!date) errors.date = "Pick a date.";
    if (!wholeDay && timeToMinutes(end) <= timeToMinutes(start)) {
      errors.end_time = "End must be after start.";
    }
    setClientErrors(errors);
    if (Object.keys(errors).length) return;

    const body = {
      date,
      start_time: wholeDay ? null : fromTimeInput(start),
      end_time: wholeDay ? null : fromTimeInput(end),
      reason,
      note: note.trim(),
    };
    const options = {
      onSuccess: () => {
        if (!replan) {
          markStale();
          onDone();
          return;
        }
        generatePlan.mutate(undefined, {
          onSuccess: (plan) => {
            recordPlan(plan);
            onDone();
          },
          onError: () => markStale(),
        });
      },
    };
    if (override) updateDayOverride.mutate({ id: override.id, ...body }, options);
    else createDayOverride.mutate(body, options);
  }

  const pending = mutation.isPending || generatePlan.isPending;

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
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
        <Field label="Reason" htmlFor={`${id}-reason`} error={errorFor("reason")}>
          <select
            id={`${id}-reason`}
            className="select w-full"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={pending}
          >
            {REASON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <label className="label cursor-pointer justify-start gap-3 py-1 text-sm text-base-content">
        <input
          type="checkbox"
          className="toggle toggle-primary toggle-sm"
          checked={wholeDay}
          onChange={(e) => setWholeDay(e.target.checked)}
          disabled={pending}
        />
        The whole day
      </label>

      {!wholeDay && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="From" htmlFor={`${id}-start`} error={errorFor("start_time")}>
            <input
              id={`${id}-start`}
              type="time"
              className="input w-full"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              disabled={pending}
            />
          </Field>
          <Field label="Until" htmlFor={`${id}-end`} error={errorFor("end_time")}>
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
      )}

      <Field label="Note" htmlFor={`${id}-note`} hint="Optional." error={errorFor("note")}>
        <textarea
          id={`${id}-note`}
          className="textarea w-full"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Rough night, taking it easy"
          disabled={pending}
        />
      </Field>

      <label className="label cursor-pointer justify-start gap-3 py-1 text-sm text-base-content">
        <input
          type="checkbox"
          className="checkbox checkbox-primary checkbox-sm"
          checked={replan}
          onChange={(e) => setReplan(e.target.checked)}
          disabled={pending}
        />
        Update my study plan now
      </label>

      <FormError message={server.general} />

      <FormActions
        onCancel={onDone}
        isPending={pending}
        submitLabel={override ? "Save changes" : replan ? "Save and replan" : "Save"}
        pendingLabel={generatePlan.isPending ? "Replanning…" : "Saving…"}
      />
    </form>
  );
}
