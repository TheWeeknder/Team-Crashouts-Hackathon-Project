import { useId, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";

import useDayOverrides from "../../hooks/useDayOverrides";
import useGeneratePlan from "../../hooks/useGeneratePlan";
import usePlanCheck, { PLAN_CHECK_KEY, fetchPlanCheck } from "../../hooks/usePlanCheck";
import usePlanStatus from "../../hooks/usePlanStatus";
import usePlannerSettings from "../../hooks/usePlannerSettings";
import {
  WEEKDAYS,
  formatDate,
  fromTimeInput,
  parseWeekdays,
  startOfWeek,
  timeToMinutes,
  toTimeInput,
  todayISO,
  weekdayOf,
} from "../../lib/dates";
import { splitServerErrors } from "../../lib/formErrors";
import { REASON_OPTIONS } from "../../lib/taskOptions";
import type { DayOverride, GeneratePlanResponse, PlanAlert } from "../../types/backend";
import { Field, FormActions, FormError } from "./Field";

const FIELDS = ["date", "start_time", "end_time", "reason", "note"] as const;
type FieldName = (typeof FIELDS)[number];

const ordinal = (n: number) => `${n}${["th", "st", "nd", "rd"][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10] ?? "th"}`;

interface DayOverrideFormProps {
  override?: DayOverride;
  // Pre-fill the date (e.g. "today" from the dashboard).
  defaultDate?: string;
  onDone: () => void;
}

// "Life happens": time you can't study, for a whole day or a time range.
// Step 1 saves it; step 2 shows what it does to your deadlines (a dry run
// of the planner) and lets you update the plan or leave it for later.
export default function DayOverrideForm({ override, defaultDate, onDone }: DayOverrideFormProps) {
  const queryClient = useQueryClient();
  const { dayOverrides, createDayOverride, updateDayOverride } = useDayOverrides();
  const { settings } = usePlannerSettings();
  const check = usePlanCheck();
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
  const [clientErrors, setClientErrors] = useState<Partial<Record<FieldName, string>>>({});

  // Step 2 state.
  const [phase, setPhase] = useState<"form" | "checking" | "impact">("form");
  const [before, setBefore] = useState<PlanAlert[]>([]);
  const [after, setAfter] = useState<GeneratePlanResponse | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const server = splitServerErrors(mutation.error ?? generatePlan.error, FIELDS);
  const errorFor = (field: FieldName) => clientErrors[field] ?? server.fields[field];

  // ---- Notes shown while filling in the form ----
  const others = (dayOverrides.data ?? []).filter((o) => o.id !== override?.id && o.date);
  const weekStart = date ? startOfWeek(date) : null;
  const daysOffThisWeek = weekStart
    ? new Set([...others.filter((o) => o.date && startOfWeek(o.date) === weekStart).map((o) => o.date), date]).size
    : 0;
  const workDays = parseWeekdays(settings.data?.work_days);
  const notStudyDay = !!date && workDays.length > 0 && !workDays.includes(weekdayOf(date));
  const duplicate = !!date && others.some((o) => o.date === date);
  const inPast = !!date && date < todayISO();

  const notes: { tone: "info" | "warning"; text: string }[] = [];
  if (inPast) notes.push({ tone: "warning", text: "This date has already passed, so it won't change your plan." });
  if (notStudyDay) {
    notes.push({
      tone: "info",
      text: `You don't study on ${WEEKDAYS[weekdayOf(date)].long}s anyway, so this won't change your plan.`,
    });
  }
  if (duplicate) notes.push({ tone: "info", text: `You already have time off on ${formatDate(date)}.` });
  if (daysOffThisWeek >= 2 && !inPast) {
    notes.push({
      tone: daysOffThisWeek >= 3 ? "warning" : "info",
      text: `This would be your ${ordinal(daysOffThisWeek)} day off this week. The next step shows if your deadlines still fit.`,
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const errors: Partial<Record<FieldName, string>> = {};
    if (!date) errors.date = "Pick a date.";
    if (!wholeDay && timeToMinutes(end) <= timeToMinutes(start)) {
      errors.end_time = "End must be after start.";
    }
    setClientErrors(errors);
    if (Object.keys(errors).length) return;

    // Snapshot the alerts before the change, to compare in step 2.
    setBefore(check.data?.alerts ?? []);
    const body = {
      date,
      start_time: wholeDay ? null : fromTimeInput(start),
      end_time: wholeDay ? null : fromTimeInput(end),
      reason,
      note: note.trim(),
    };
    const options = {
      onSuccess: () => {
        setPhase("checking");
        fetchPlanCheck()
          .then((result) => {
            queryClient.setQueryData(PLAN_CHECK_KEY, result);
            setAfter(result);
            setPhase("impact");
          })
          .catch((err: Error) => {
            // The time off is saved; we just could not preview the impact.
            setCheckError(err.message);
            setAfter(null);
            setPhase("impact");
          });
      },
    };
    if (override) updateDayOverride.mutate({ id: override.id, ...body }, options);
    else createDayOverride.mutate(body, options);
  }

  function updatePlan() {
    generatePlan.mutate(undefined, {
      onSuccess: () => {
        recordPlan();
        onDone();
      },
    });
  }

  function notNow() {
    markStale();
    onDone();
  }

  // ---- Step 2: impact ----
  if (phase !== "form") {
    if (phase === "checking") {
      return (
        <div className="flex flex-col items-center gap-3 py-10 text-base-content/70" role="status">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p>Saved. Checking your deadlines…</p>
        </div>
      );
    }
    const beforeShort = new Map(before.map((a) => [a.project, a.shortfall_hours]));
    const alerts = after?.alerts ?? [];
    return (
      <div className="flex flex-col gap-3">
        <div role="status" className="alert alert-success alert-soft text-sm">
          Time off saved for {formatDate(date)}.
        </div>

        {checkError ? (
          <div role="alert" className="alert alert-warning alert-soft text-sm">
            Could not check your deadlines ({checkError}). You can still update your plan.
          </div>
        ) : alerts.length === 0 ? (
          <p className="rounded-box bg-success/10 p-4 text-sm">
            <strong>Everything still fits</strong> before its deadline.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium">With this time off:</p>
            <ul className="space-y-2">
              {alerts.map((a) => {
                const was = beforeShort.get(a.project) ?? 0;
                const change =
                  was === 0
                    ? "newly at risk"
                    : a.shortfall_hours > was
                      ? `was ${was} h short`
                      : a.shortfall_hours < was
                        ? `better: was ${was} h short`
                        : "no change";
                return (
                  <li
                    key={a.project}
                    className={`rounded-box border-l-4 p-3 text-sm ${
                      a.severity === "critical" ? "border-error bg-error/10" : "border-warning bg-warning/10"
                    }`}
                  >
                    <p className="font-semibold">
                      {a.project_title}: {a.shortfall_hours} h short{" "}
                      <span className="font-normal text-base-content/60">({change})</span>
                    </p>
                    <p className="text-base-content/70">
                      Only {a.available_hours} of {a.remaining_hours} h fit
                      {a.deadline ? ` before ${formatDate(a.deadline)}` : ""}.
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <FormError message={generatePlan.error ? `Could not update your plan: ${generatePlan.error.message}` : null} />

        <div className="modal-action mt-2">
          <button type="button" className="btn btn-ghost" onClick={notNow} disabled={generatePlan.isPending}>
            Not now
          </button>
          <button type="button" className="btn btn-primary" onClick={updatePlan} disabled={generatePlan.isPending}>
            {generatePlan.isPending && <span className="loading loading-spinner loading-sm" />}
            {generatePlan.isPending ? "Updating…" : "Update my plan"}
          </button>
        </div>
      </div>
    );
  }

  // ---- Step 1: form ----
  const pending = mutation.isPending;

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

      {notes.length > 0 && (
        <ul className="space-y-1.5" aria-live="polite">
          {notes.map((n) => (
            <li
              key={n.text}
              className={`rounded-field px-3 py-2 text-sm ${
                n.tone === "warning" ? "bg-warning/15 text-base-content" : "bg-info/10 text-base-content/80"
              }`}
            >
              {n.text}
            </li>
          ))}
        </ul>
      )}

      <FormError message={server.general} />

      <FormActions
        onCancel={onDone}
        isPending={pending}
        submitLabel={override ? "Save and check" : "Save and check my deadlines"}
        pendingLabel="Saving…"
      />
    </form>
  );
}
