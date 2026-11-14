import { useId } from "react";

import type { WeeklySummary } from "../types/api";

interface ProgressTrackerProps {
  summary: WeeklySummary;
}

const hoursFormatter = new Intl.NumberFormat("en-CA", {
  maximumFractionDigits: 2,
});

const deadlineFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Edmonton",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatHours(hours: number): string {
  return hoursFormatter.format(hours);
}

function clampPercent(percent: number): number {
  if (!Number.isFinite(percent)) {
    return 0;
  }

  return Math.min(100, Math.max(0, percent));
}

export default function ProgressTracker({
  summary,
}: ProgressTrackerProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm"
    >
      <header className="mb-5">
        <h2 id={headingId} className="text-xl font-semibold">
          Study progress
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Weekly hours and overall task completion.
        </p>
      </header>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-violet-50 p-4">
          <dt className="text-sm text-violet-700">
            Planned this week
          </dt>

          <dd className="mt-1 text-2xl font-bold text-violet-900">
            {formatHours(summary.planned_hours)}
            <span className="ml-1 text-sm font-normal">hrs</span>
          </dd>
        </div>

        <div className="rounded-lg bg-emerald-50 p-4">
          <dt className="text-sm text-emerald-700">
            Done this week
          </dt>

          <dd className="mt-1 text-2xl font-bold text-emerald-900">
            {formatHours(summary.done_hours)}
            <span className="ml-1 text-sm font-normal">hrs</span>
          </dd>
        </div>

        <div className="rounded-lg bg-amber-50 p-4">
          <dt className="text-sm text-amber-700">
            Missed this week
          </dt>

          <dd className="mt-1 text-2xl font-bold text-amber-900">
            {formatHours(summary.missed_hours)}
            <span className="ml-1 text-sm font-normal">hrs</span>
          </dd>
        </div>
      </dl>

      <div className="mt-6">
        <h3 className="text-base font-semibold">
          Task progress
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          Task completion includes all logged hours, not just this week.
          Deadlines are shown in Edmonton time.
        </p>

        {summary.tasks.length === 0 ? (
          <div className="mt-4 rounded-lg bg-slate-50 px-4 py-6 text-center">
            <p className="font-medium">No tasks to track</p>

            <p className="mt-1 text-sm text-slate-600">
              Add a task to start tracking your progress.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {summary.tasks.map((task) => {
              const percent = clampPercent(task.percent);
              const displayPercent = Math.round(percent);

              return (
                <li
                  key={task.task_id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h4 className="font-semibold">
                      {task.title}
                    </h4>

                    {task.at_risk && (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
                        At risk
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Due{" "}
                    <time dateTime={task.deadline}>
                      {deadlineFormatter.format(
                        new Date(task.deadline),
                      )}
                    </time>
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-600">
                      {formatHours(task.completed_hours)} /{" "}
                      {formatHours(task.estimated_hours)} hrs
                    </span>

                    <span className="font-medium">
                      {displayPercent}%
                    </span>
                  </div>

                  <progress
                    className={`mt-2 block h-3 w-full overflow-hidden rounded-full border-0 bg-slate-100
                      [&::-webkit-progress-bar]:rounded-full
                      [&::-webkit-progress-bar]:bg-slate-100
                      [&::-webkit-progress-value]:rounded-full
                      [&::-moz-progress-bar]:rounded-full
                      ${
                        task.at_risk
                          ? "accent-amber-500 [&::-webkit-progress-value]:bg-amber-500 [&::-moz-progress-bar]:bg-amber-500"
                          : "accent-violet-600 [&::-webkit-progress-value]:bg-violet-600 [&::-moz-progress-bar]:bg-violet-600"
                      }`}
                    value={percent}
                    max={100}
                    aria-label={`${task.title} completion`}
                    aria-valuetext={`${displayPercent}% complete, ${formatHours(
                      task.completed_hours,
                    )} of ${formatHours(task.estimated_hours)} hours`}
                  >
                    {displayPercent}%
                  </progress>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}