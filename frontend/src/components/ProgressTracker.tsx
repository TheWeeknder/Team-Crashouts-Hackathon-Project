import { useId } from "react";

import type { WeeklySummary } from "../types/api";

interface ProgressTrackerProps {
  summary: WeeklySummary;
}

const hoursFormatter = new Intl.NumberFormat("en-CA", {
  maximumFractionDigits: 2,
});

const deadlineFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
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
      className="card border border-base-300 bg-base-100 p-5 shadow-sm"
    >
      <header className="mb-5">
        <h2 id={headingId} className="text-xl font-semibold">
          Study progress
        </h2>

        <p className="mt-1 text-sm text-base-content/70">
          Weekly hours and overall task completion.
        </p>
      </header>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-box bg-primary/10 p-4">
          <dt className="text-sm font-medium text-primary">
            Planned this week
          </dt>

          <dd className="mt-1 text-3xl font-bold">
            {formatHours(summary.planned_hours)}
            <span className="ml-1 text-sm font-normal">hrs</span>
          </dd>
        </div>

        <div className="rounded-box bg-success/10 p-4">
          <dt className="text-sm font-medium text-success">
            Done this week
          </dt>

          <dd className="mt-1 text-3xl font-bold">
            {formatHours(summary.done_hours)}
            <span className="ml-1 text-sm font-normal">hrs</span>
          </dd>
        </div>

        <div className="rounded-box bg-warning/15 p-4">
          <dt className="text-sm font-medium text-base-content/80">
            Missed this week
          </dt>

          <dd className="mt-1 text-3xl font-bold">
            {formatHours(summary.missed_hours)}
            <span className="ml-1 text-sm font-normal">hrs</span>
          </dd>
        </div>
      </dl>

      <div className="mt-6">
        <h3 className="text-base font-semibold">
          Task progress
        </h3>

        <p className="mt-1 text-xs text-base-content/50">
          Task completion includes all logged hours, not just this week.
        </p>

        {summary.tasks.length === 0 ? (
          <div className="mt-4 rounded-box bg-base-200 px-4 py-8 text-center">
            <p className="font-medium">No tasks to track</p>

            <p className="mt-1 text-sm text-base-content/70">
              Add a task to start tracking your progress.
            </p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {summary.tasks.map((task) => {
              const percent = clampPercent(task.percent);
              const displayPercent = Math.round(percent);

              return (
                <li
                  key={task.task_id}
                  className="rounded-box border border-base-300 p-4 transition hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h4 className="font-semibold">
                      {task.title}
                    </h4>

                    {task.at_risk && (
                      <span className="badge badge-warning badge-sm">
                        At risk
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-base-content/50">
                    {task.deadline ? (
                      <>
                        Due{" "}
                        <time dateTime={task.deadline}>
                          {deadlineFormatter.format(
                            new Date(task.deadline),
                          )}
                        </time>
                      </>
                    ) : (
                      "No deadline"
                    )}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                    <span className="text-base-content/70">
                      {formatHours(task.completed_hours)} /{" "}
                      {formatHours(task.estimated_hours)} hrs
                    </span>

                    <span className="font-medium">
                      {displayPercent}%
                    </span>
                  </div>

                  <progress
                    className={`progress mt-2 h-2.5 w-full ${
                      task.at_risk ? "progress-warning" : "progress-primary"
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