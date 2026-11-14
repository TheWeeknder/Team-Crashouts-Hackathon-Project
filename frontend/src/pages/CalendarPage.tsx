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

export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] =
    useState<CalendarEvent | null>(null);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-3xl font-bold">Study calendar</h1>

        <p className="mt-2">
          Your monthly overview of study sessions and commitments.
          All times are shown in Edmonton time.
        </p>
      </header>

      <p className="text-sm">
        Showing sample data for November 16–22, 2026.
      </p>

      <MonthlyCalendar
        events={mockEvents}
        initialDate="2026-11-16"
        onEventClick={setSelectedEvent}
      />

      {selectedEvent && (
        <section
          className="rounded-lg border border-gray-300 p-4"
          aria-labelledby="selected-event-title"
        >
          <div className="flex items-start justify-between gap-4">
            <h2
              id="selected-event-title"
              className="text-xl font-semibold"
            >
              {selectedEvent.title}
            </h2>

            <button
              type="button"
              className="rounded border px-3 py-1"
              onClick={() => setSelectedEvent(null)}
            >
              Close
            </button>
          </div>

          <dl className="mt-4 space-y-3">
            <div>
              <dt className="font-medium">Type</dt>
              <dd>
                {selectedEvent.type === "study"
                  ? "Study session"
                  : "Commitment"}
              </dd>
            </div>

            <div>
              <dt className="font-medium">Starts</dt>
              <dd>{formatDateTime(selectedEvent.start)}</dd>
            </div>

            <div>
              <dt className="font-medium">Ends</dt>
              <dd>{formatDateTime(selectedEvent.end)}</dd>
            </div>

            {selectedEvent.type === "study" ? (
              <>
                <div>
                  <dt className="font-medium">Status</dt>
                  <dd>{selectedEvent.status}</dd>
                </div>

                <div>
                  <dt className="font-medium">Locked</dt>
                  <dd>{selectedEvent.locked ? "Yes" : "No"}</dd>
                </div>
              </>
            ) : (
              <div>
                <dt className="font-medium">Kind</dt>
                <dd>{selectedEvent.kind}</dd>
              </div>
            )}
          </dl>
        </section>
      )}
    </div>
  );
}