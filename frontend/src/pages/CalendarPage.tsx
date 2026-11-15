import { useMemo, useState } from "react";

import EventDetails from "../components/EventDetails";
import MonthlyCalendar from "../components/MonthlyCalendar";
import usePlannerData from "../hooks/usePlannerData";
import { addDays, todayISO } from "../lib/dates";
import { buildCalendarEvents } from "../lib/events";

// How far back and ahead recurring commitments are expanded.
const DAYS_BACK = 120;
const DAYS_AHEAD = 240;

export default function CalendarPage() {
  const data = usePlannerData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const today = todayISO();
  const events = useMemo(
    () =>
      buildCalendarEvents(
        {
          projects: data.projects,
          blocks: data.blocks,
          commitments: data.commitments,
          overrides: data.overrides,
        },
        addDays(today, -DAYS_BACK),
        addDays(today, DAYS_AHEAD),
      ),
    [data.projects, data.blocks, data.commitments, data.overrides, today],
  );

  // Look the event up by id so the panel shows fresh data after an update.
  const selected = events.find((event) => event.id === selectedId) ?? null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Study calendar</h1>
        <p className="mt-1 text-base-content/70">
          Your study sessions, commitments, time off and deadlines by month.
        </p>
      </header>

      {data.error && (
        <div role="alert" className="alert alert-error alert-soft">
          Could not load your calendar: {data.error.message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="relative min-w-0 lg:col-span-2">
          {data.isLoading && (
            <div className="absolute inset-0 z-10 grid place-items-center rounded-box bg-base-100/60">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          )}
          <MonthlyCalendar
            events={events}
            initialDate={today}
            onEventClick={(event) => setSelectedId(event.id)}
          />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {selected ? (
            <section
              className="card border border-base-300 bg-base-100 shadow-sm"
              aria-label="Event details"
            >
              <div
                className="h-2 rounded-t-box"
                style={{ backgroundColor: selected.color }}
                aria-hidden="true"
              />
              <div className="card-body">
                <div className="-mb-2 flex justify-end">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-circle"
                    onClick={() => setSelectedId(null)}
                    aria-label="Close event details"
                  >
                    ✕
                  </button>
                </div>
                <EventDetails event={selected} projects={data.projects} blocks={data.blocks} />
              </div>
            </section>
          ) : (
            <div className="card border border-dashed border-base-300 bg-base-100/60">
              <div className="card-body items-center py-12 text-center">
                <span
                  className="grid size-12 place-items-center rounded-full bg-primary/10 text-xl text-primary"
                  aria-hidden="true"
                >
                  ◷
                </span>
                <p className="mt-2 font-medium">No event selected</p>
                <p className="text-sm text-base-content/60">
                  Click an event on the calendar to see its details.
                </p>
              </div>
            </div>
          )}

          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-base-content/60">
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#9575CD]" aria-hidden="true" /> Study (task colour)
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#64748B]" aria-hidden="true" /> Commitment
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#E11D48]" aria-hidden="true" /> Time off
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#D97706]" aria-hidden="true" /> Deadline
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
