import { useMemo, useState } from "react";

import EventDetails from "../components/EventDetails";
import Modal from "../components/Modal";
import PlanForDay from "../components/PlanForDay";
import ProgressTracker from "../components/ProgressTracker";
import WeeklyCalendar from "../components/WeeklyCalendar";
import CommitmentForm from "../components/forms/CommitmentForm";
import DayOverrideForm from "../components/forms/DayOverrideForm";
import TaskForm from "../components/forms/TaskForm";
import useGeneratePlan from "../hooks/useGeneratePlan";
import usePlanCheck from "../hooks/usePlanCheck";
import usePlanStatus, { type PlanStatus } from "../hooks/usePlanStatus";
import usePlannerData from "../hooks/usePlannerData";
import {
  addDays,
  formatDate,
  parseISODate,
  startOfWeek,
  todayISO,
} from "../lib/dates";
import { buildCalendarEvents, buildWeeklySummary } from "../lib/events";
import type { ISODate, PlanAlert } from "../types/backend";

type DialogName = "task" | "commitment" | "override" | null;

const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const rangeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface DashboardPageProps {
  onOpenSettings: () => void;
}

export default function DashboardPage({ onOpenSettings }: DashboardPageProps) {
  const data = usePlannerData();
  const { generatePlan } = useGeneratePlan();
  const { status, recordPlan } = usePlanStatus();
  const hasTasks = data.projects.length > 0;
  // Live alerts: a dry run of the planner with the current inputs. Loads
  // with the page and refreshes after every save, so it survives reloads.
  const check = usePlanCheck({ enabled: hasTasks });
  const alerts = useMemo(() => (hasTasks ? (check.data?.alerts ?? []) : []), [hasTasks, check.data]);

  const today = todayISO();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [selectedDate, setSelectedDate] = useState<ISODate>(today);
  const [dialog, setDialog] = useState<DialogName>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const weekEnd = addDays(weekStart, 6);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const events = useMemo(
    () =>
      buildCalendarEvents(
        {
          projects: data.projects,
          blocks: data.blocks,
          commitments: data.commitments,
          overrides: data.overrides,
        },
        weekStart,
        weekEnd,
      ),
    [data.projects, data.blocks, data.commitments, data.overrides, weekStart, weekEnd],
  );

  const summary = useMemo(
    () =>
      buildWeeklySummary(
        {
          projects: data.projects,
          blocks: data.blocks,
          settings: data.settings,
          commitments: data.commitments,
          overrides: data.overrides,
          alerts,
        },
        weekStart,
      ),
    [data.projects, data.blocks, data.settings, data.commitments, data.overrides, alerts, weekStart],
  );

  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? null;

  function goToWeek(start: ISODate) {
    setWeekStart(start);
    const end = addDays(start, 6);
    setSelectedDate(today >= start && today <= end ? today : start);
  }

  function runPlan() {
    generatePlan.mutate(undefined, { onSuccess: recordPlan });
  }

  const hasPlan = data.blocks.length > 0;
  const hasGenerated = hasPlan || status.generatedAt !== null;
  // The checklist guides new accounts until their first plan. Alerts are
  // shown separately whenever the planner has something to warn about, so
  // a shortfall stays visible even when time off removes every block.
  const showChecklist = !data.isLoading && (!hasTasks || !hasGenerated);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-base-content/70">
            Your week at a glance. Add what's on your plate, then generate a plan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {status.stale && hasTasks && hasGenerated && (
            <span className="badge badge-warning badge-sm">Update needed</span>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={runPlan}
            disabled={generatePlan.isPending || !hasTasks}
            title={hasTasks ? undefined : "Add a task first"}
          >
            {generatePlan.isPending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <span aria-hidden="true">⟳</span>
            )}
            {generatePlan.isPending ? "Planning…" : hasPlan ? "Regenerate plan" : "Generate plan"}
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Quick add">
        <button type="button" className="btn btn-sm btn-soft btn-primary" onClick={() => setDialog("task")}>
          + Add task
        </button>
        <button type="button" className="btn btn-sm btn-soft" onClick={() => setDialog("commitment")}>
          + Add commitment
        </button>
        <button type="button" className="btn btn-sm btn-soft btn-error" onClick={() => setDialog("override")}>
          Can't study today
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onOpenSettings}>
          Study hours
        </button>
      </div>

      {data.error && (
        <div role="alert" className="alert alert-error alert-soft">
          Could not load your data: {data.error.message}
        </div>
      )}

      {generatePlan.error && (
        <div role="alert" className="alert alert-error alert-soft">
          Could not generate a plan: {generatePlan.error.message}
        </div>
      )}

      {hasTasks && (
        <PlanAlerts
          status={status}
          alerts={alerts}
          checked={check.isSuccess}
          checkError={check.error?.message ?? null}
          hasPlan={hasPlan}
          hasGenerated={hasGenerated}
          onRegenerate={runPlan}
          isPlanning={generatePlan.isPending}
        />
      )}

      {showChecklist && (
        <SetupChecklist
          hasSettings={data.settings !== null}
          hasTasks={hasTasks}
          hasCommitments={data.commitments.length > 0}
          hasPlan={hasGenerated}
          isPlanning={generatePlan.isPending}
          onSettings={onOpenSettings}
          onTask={() => setDialog("task")}
          onCommitment={() => setDialog("commitment")}
          onPlan={runPlan}
        />
      )}

      {/* Week control shared by the calendar and the day picker. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="join">
          <button
            type="button"
            className="btn join-item btn-sm"
            onClick={() => goToWeek(addDays(weekStart, -7))}
            aria-label="Previous week"
          >
            ‹
          </button>
          <button
            type="button"
            className="btn join-item btn-sm"
            onClick={() => goToWeek(startOfWeek(today))}
            disabled={weekStart === startOfWeek(today)}
          >
            This week
          </button>
          <button
            type="button"
            className="btn join-item btn-sm"
            onClick={() => goToWeek(addDays(weekStart, 7))}
            aria-label="Next week"
          >
            ›
          </button>
        </div>
        <p className="text-sm font-medium text-base-content/70">
          {rangeFormatter.formatRange(parseISODate(weekStart), parseISODate(weekEnd))}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="relative min-w-0 lg:col-span-2">
          {data.isLoading && (
            <div className="absolute inset-0 z-10 grid place-items-center rounded-box bg-base-100/60">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          )}
          <WeeklyCalendar
            key={weekStart}
            events={events}
            initialDate={weekStart}
            hideNavigation
            onEventClick={(event) => setSelectedEventId(event.id)}
          />
        </div>

        <div className="space-y-3">
          <div
            role="tablist"
            aria-label="Choose a day"
            className="grid grid-cols-7 gap-1 rounded-box border border-base-300 bg-base-100 p-1 shadow-sm"
          >
            {weekDays.map((date) => {
              const active = date === selectedDate;
              return (
                <button
                  key={date}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`flex flex-col items-center rounded-field py-1.5 text-xs transition ${
                    active
                      ? "bg-primary text-primary-content shadow"
                      : date === today
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-base-200"
                  }`}
                  onClick={() => setSelectedDate(date)}
                >
                  <span className="opacity-80">{weekdayFormatter.format(parseISODate(date))}</span>
                  <span className="text-base font-semibold">{parseISODate(date).getDate()}</span>
                </button>
              );
            })}
          </div>

          <PlanForDay
            date={selectedDate}
            events={events}
            onEventClick={(event) => setSelectedEventId(event.id)}
          />
        </div>
      </div>

      <ProgressTracker summary={summary} />

      <Modal
        open={dialog === "task"}
        onClose={() => setDialog(null)}
        title="Add a task"
        description="Anything with a deadline: assignments, projects, exam prep."
      >
        <TaskForm onDone={() => setDialog(null)} />
      </Modal>

      <Modal
        open={dialog === "commitment"}
        onClose={() => setDialog(null)}
        title="Add a commitment"
        description="Work shifts, classes, practice. The planner won't schedule study here."
      >
        <CommitmentForm onDone={() => setDialog(null)} />
      </Modal>

      <Modal
        open={dialog === "override"}
        onClose={() => setDialog(null)}
        title="Can't study?"
        description="Block off time and the planner moves your sessions."
      >
        <DayOverrideForm defaultDate={today} onDone={() => setDialog(null)} />
      </Modal>

      <Modal
        open={selectedEvent !== null}
        onClose={() => setSelectedEventId(null)}
        title="Event details"
      >
        {selectedEvent && (
          <EventDetails event={selectedEvent} projects={data.projects} blocks={data.blocks} />
        )}
      </Modal>
    </div>
  );
}

// ---------- Alerts from the last plan ----------

function PlanAlerts({
  status,
  alerts,
  checked,
  checkError,
  hasPlan,
  hasGenerated,
  onRegenerate,
  isPlanning,
}: {
  status: PlanStatus;
  alerts: PlanAlert[];
  checked: boolean;
  checkError: string | null;
  hasPlan: boolean;
  hasGenerated: boolean;
  onRegenerate: () => void;
  isPlanning: boolean;
}) {
  return (
    <div className="space-y-3">
      {status.stale && hasGenerated && (
        <div role="status" className="alert alert-warning alert-soft">
          <span>You changed your tasks or schedule. Regenerate to update your plan.</span>
          <button type="button" className="btn btn-sm" onClick={onRegenerate} disabled={isPlanning}>
            Regenerate
          </button>
        </div>
      )}

      {checkError && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>Could not check your deadlines: {checkError}</span>
        </div>
      )}

      {checked && hasPlan && !status.stale && alerts.length === 0 && (
        <div role="status" className="alert alert-success alert-soft">
          <span>Everything fits before its deadline. Nice.</span>
        </div>
      )}

      {alerts.length > 0 && hasGenerated && !hasPlan && !status.stale && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>
            <strong>No study time is left in your plan.</strong> Time off, commitments or your study
            hours leave no room before your deadlines. See below for what to change.
          </span>
        </div>
      )}

      {alerts.map((alert) => (
        <div
          key={alert.project}
          role="alert"
          className={`alert items-start ${
            alert.severity === "critical" ? "alert-error" : "alert-warning"
          } alert-soft`}
        >
          <div className="w-full">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-bold">
                {alert.project_title}: {alert.shortfall_hours} h short
              </h3>
              <span className="text-xs opacity-80">
                {alert.deadline ? `Due ${formatDate(alert.deadline)} · ` : ""}
                {alert.available_hours} of {alert.remaining_hours} h fit
              </span>
            </div>
            {alert.suggestions.length > 0 && (
              <ul className="mt-1 list-inside list-disc text-sm">
                {alert.suggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- First-run checklist ----------

interface ChecklistProps {
  hasSettings: boolean;
  hasTasks: boolean;
  hasCommitments: boolean;
  hasPlan: boolean;
  isPlanning: boolean;
  onSettings: () => void;
  onTask: () => void;
  onCommitment: () => void;
  onPlan: () => void;
}

function SetupChecklist(props: ChecklistProps) {
  const steps = [
    {
      done: props.hasSettings,
      title: "Set your study hours",
      text: "When and how long you like to study. Defaults: 9 AM to 7 PM, up to 6 h a day.",
      action: "Set hours",
      doneAction: "Edit hours",
      onClick: props.onSettings,
      optional: true,
    },
    {
      done: props.hasTasks,
      title: "Add a task with a deadline",
      text: "Assignments, projects, exam prep, with how many hours each needs.",
      action: "Add task",
      doneAction: "Add another",
      onClick: props.onTask,
    },
    {
      done: props.hasCommitments,
      title: "Add your commitments",
      text: "Work shifts, classes and practice, so study never clashes with them.",
      action: "Add commitment",
      doneAction: "Add another",
      onClick: props.onCommitment,
      optional: true,
    },
    {
      done: props.hasPlan,
      title: "Generate your plan",
      text: "The planner fits study sessions before each deadline.",
      action: "Generate",
      doneAction: "Regenerate",
      onClick: props.onPlan,
      disabled: !props.hasTasks || props.isPlanning,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section
      className="card border border-primary/30 bg-base-100 shadow-sm"
      aria-labelledby="setup-title"
    >
      <div className="card-body">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="setup-title" className="card-title">
            Get your plan in 4 steps
          </h2>
          <span className="text-sm text-base-content/60">
            {doneCount} of {steps.length} done
          </span>
        </div>
        <progress className="progress progress-primary h-1.5" value={doneCount} max={steps.length} />
        <ol className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className={`flex flex-col gap-2 rounded-box border p-4 ${
                step.done ? "border-success/40 bg-success/5" : "border-base-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`grid size-7 place-items-center rounded-full text-sm font-bold ${
                    step.done ? "bg-success text-success-content" : "bg-primary/10 text-primary"
                  }`}
                  aria-hidden="true"
                >
                  {step.done ? "✓" : i + 1}
                </span>
                <h3 className="font-semibold">
                  {step.title}
                  {step.optional && (
                    <span className="ml-1 text-xs font-normal text-base-content/50">(optional)</span>
                  )}
                </h3>
              </div>
              <p className="flex-1 text-sm text-base-content/70">{step.text}</p>
              <button
                type="button"
                className={`btn btn-sm ${step.done ? "btn-ghost" : "btn-primary"}`}
                onClick={step.onClick}
                disabled={step.disabled}
              >
                {step.done ? step.doneAction : step.action}
                <span className="sr-only">{step.done ? " (done)" : ""}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
