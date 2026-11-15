import { useId, useState, type FormEvent } from "react";

import usePlannerSettings from "../../hooks/usePlannerSettings";
import usePlanStatus from "../../hooks/usePlanStatus";
import {
  formatWeekdays,
  fromTimeInput,
  parseWeekdays,
  timeToMinutes,
  toTimeInput,
} from "../../lib/dates";
import { splitServerErrors } from "../../lib/formErrors";
import { Field, FormActions, FormError, WeekdayPicker } from "./Field";

// Same defaults the backend scheduler uses when a value is empty or 0.
const DEFAULTS = {
  start: "09:00",
  end: "19:00",
  workDays: [0, 1, 2, 3, 4, 5, 6],
  maxHours: 6,
  minBlock: 30,
  maxBlock: 120,
  breakMinutes: 15,
};

const FIELDS = [
  "day_start_time",
  "day_end_time",
  "work_days",
  "max_hours_per_day",
  "min_block_minutes",
  "max_block_minutes",
  "break_minutes",
] as const;
type FieldName = (typeof FIELDS)[number];

const positive = (value: number | null | undefined, fallback: number) =>
  value && value > 0 ? value : fallback;

export default function SettingsForm({ onDone }: { onDone: () => void }) {
  const { settings, saveSettings } = usePlannerSettings();
  const { markStale } = usePlanStatus();
  const current = settings.data;
  const id = useId();

  const [start, setStart] = useState(toTimeInput(current?.day_start_time) || DEFAULTS.start);
  const [end, setEnd] = useState(toTimeInput(current?.day_end_time) || DEFAULTS.end);
  const [workDays, setWorkDays] = useState(() => {
    const days = parseWeekdays(current?.work_days);
    return days.length ? days : DEFAULTS.workDays;
  });
  const [maxHours, setMaxHours] = useState(String(positive(current?.max_hours_per_day, DEFAULTS.maxHours)));
  const [minBlock, setMinBlock] = useState(String(positive(current?.min_block_minutes, DEFAULTS.minBlock)));
  const [maxBlock, setMaxBlock] = useState(String(positive(current?.max_block_minutes, DEFAULTS.maxBlock)));
  const [breakMinutes, setBreakMinutes] = useState(
    String(current?.break_minutes ?? DEFAULTS.breakMinutes),
  );
  const [clientErrors, setClientErrors] = useState<Partial<Record<FieldName, string>>>({});

  const server = splitServerErrors(saveSettings.error, FIELDS);
  const errorFor = (field: FieldName) => clientErrors[field] ?? server.fields[field];

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const errors: Partial<Record<FieldName, string>> = {};
    const int = (value: string) => (Number.isInteger(Number(value)) && value !== "" ? Number(value) : NaN);
    if (timeToMinutes(end) <= timeToMinutes(start)) errors.day_end_time = "Must be after the start time.";
    if (workDays.length === 0) errors.work_days = "Pick at least one day.";
    const hours = int(maxHours);
    if (!(hours >= 1 && hours <= 24)) errors.max_hours_per_day = "Between 1 and 24.";
    const min = int(minBlock);
    const max = int(maxBlock);
    if (!(min >= 15)) errors.min_block_minutes = "At least 15 minutes.";
    if (!(max >= 15)) errors.max_block_minutes = "At least 15 minutes.";
    else if (min > max) errors.max_block_minutes = "Must be at least the shortest session.";
    const rest = int(breakMinutes);
    if (!(rest >= 0)) errors.break_minutes = "0 or more minutes.";
    setClientErrors(errors);
    if (Object.keys(errors).length) return;

    saveSettings.mutate(
      {
        day_start_time: fromTimeInput(start),
        day_end_time: fromTimeInput(end),
        work_days: formatWeekdays(workDays),
        max_hours_per_day: hours,
        min_block_minutes: min,
        max_block_minutes: max,
        break_minutes: rest,
      },
      {
        onSuccess: () => {
          markStale();
          onDone();
        },
      },
    );
  }

  const pending = saveSettings.isPending;

  if (settings.isPending) {
    return (
      <div className="flex justify-center py-10">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Study from" htmlFor={`${id}-start`} error={errorFor("day_start_time")}>
          <input
            id={`${id}-start`}
            type="time"
            className="input w-full"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            disabled={pending}
          />
        </Field>
        <Field label="Study until" htmlFor={`${id}-end`} error={errorFor("day_end_time")}>
          <input
            id={`${id}-end`}
            type="time"
            className={`input w-full ${errorFor("day_end_time") ? "input-error" : ""}`}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            disabled={pending}
          />
        </Field>
      </div>

      <Field label="Days I can study" error={errorFor("work_days")}>
        <WeekdayPicker
          value={workDays}
          onChange={setWorkDays}
          disabled={pending}
          invalid={!!errorFor("work_days")}
        />
      </Field>

      <Field
        label="Most hours of study per day"
        htmlFor={`${id}-max-hours`}
        error={errorFor("max_hours_per_day")}
      >
        <input
          id={`${id}-max-hours`}
          type="number"
          min={1}
          max={24}
          step={1}
          className={`input w-full ${errorFor("max_hours_per_day") ? "input-error" : ""}`}
          value={maxHours}
          onChange={(e) => setMaxHours(e.target.value)}
          disabled={pending}
        />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Shortest session" htmlFor={`${id}-min`} hint="minutes" error={errorFor("min_block_minutes")}>
          <input
            id={`${id}-min`}
            type="number"
            min={15}
            step={15}
            className={`input w-full ${errorFor("min_block_minutes") ? "input-error" : ""}`}
            value={minBlock}
            onChange={(e) => setMinBlock(e.target.value)}
            disabled={pending}
          />
        </Field>
        <Field label="Longest session" htmlFor={`${id}-max`} hint="minutes" error={errorFor("max_block_minutes")}>
          <input
            id={`${id}-max`}
            type="number"
            min={15}
            step={15}
            className={`input w-full ${errorFor("max_block_minutes") ? "input-error" : ""}`}
            value={maxBlock}
            onChange={(e) => setMaxBlock(e.target.value)}
            disabled={pending}
          />
        </Field>
        <Field label="Break" htmlFor={`${id}-break`} hint="minutes" error={errorFor("break_minutes")}>
          <input
            id={`${id}-break`}
            type="number"
            min={0}
            step={5}
            className={`input w-full ${errorFor("break_minutes") ? "input-error" : ""}`}
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(e.target.value)}
            disabled={pending}
          />
        </Field>
      </div>

      <FormError message={server.general} />

      <FormActions onCancel={onDone} isPending={pending} submitLabel="Save settings" pendingLabel="Saving…" />
    </form>
  );
}
