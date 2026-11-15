import { useState } from "react";

import MonthlyCalendar from "../components/MonthlyCalendar";
import { mockEvents } from "../services/mocks";
import type { CalendarEvent } from "../types/api";

const dateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Edmonton",
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const statusBadge: Record<string, string> = {
  done: "badge-success",
  planned: "badge-primary",
  missed: "badge-error",
};

export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] =
    useState<CalendarEvent | null>(null);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Study calendar</h1>
          <p className="mt-1 text-base-content/70">
            Your monthly overview of study sessions and commitments. All
            times are shown in Edmonton time.
          </p>
        </div>
        <span className="badge badge-ghost badge-lg">
          Sample data · Nov 16–22, 2026
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonthlyCalendar
            events={mockEvents}
            initialDate="2026-11-16"
            onEventClick={setSelectedEvent}
          />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {selectedEvent ? (
            <section
              className="card border border-base-300 bg-base-100 shadow-sm"
              aria-labelledby="selected-event-title"
            >
              <div
                className="h-2 rounded-t-box"
                style={{ backgroundColor: selectedEvent.color }}
                aria-hidden="true"
              />
              <div className="card-body gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="badge badge-soft badge-sm">
                      {selectedEvent.type === "study"
                        ? "Study session"
                        : "Commitment"}
                    </span>
                    <h2
                      id="selected-event-title"
                      className="card-title mt-2 text-xl"
                    >
                      {selectedEvent.title}
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-circle"
                    onClick={() => setSelectedEvent(null)}
                    aria-label="Close event details"
                  >
                    ✕
                  </button>
                </div>

                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
                  <dt className="text-base-content/60">Starts</dt>
                  <dd className="font-medium">
                    {formatDateTime(selectedEvent.start)}
                  </dd>

                  <dt className="text-base-content/60">Ends</dt>
                  <dd className="font-medium">
                    {formatDateTime(selectedEvent.end)}
                  </dd>

                  {selectedEvent.type === "study" ? (
                    <>
                      <dt className="text-base-content/60">Status</dt>
                      <dd>
                        <span
                          className={`badge badge-sm ${
                            statusBadge[selectedEvent.status] ?? "badge-ghost"
                          }`}
                        >
                          {formatLabel(selectedEvent.status)}
                        </span>
                      </dd>

                      <dt className="text-base-content/60">Locked</dt>
                      <dd className="font-medium">
                        {selectedEvent.locked ? "Yes" : "No"}
                      </dd>
                    </>
                  ) : (
                    <>
                      <dt className="text-base-content/60">Kind</dt>
                      <dd className="font-medium">
                        {formatLabel(selectedEvent.kind)}
                      </dd>
                    </>
                  )}
                </dl>
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
        </aside>
      </div>
    </div>
  );
}
