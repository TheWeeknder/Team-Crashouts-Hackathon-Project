import { useState } from "react";

import PlanForDay from "../components/PlanForDay";
import ProgressTracker from "../components/ProgressTracker";
import WeeklyCalendar from "../components/WeeklyCalendar";
import { mockEvents, mockWeeklySummary } from "../services/mocks";
import type { ISODate } from "../types/api";

const dayTabFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "UTC",
  weekday: "short",
});

const dayNumberFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "UTC",
  day: "numeric",
});

function dayLabel(date: ISODate) {
  const value = new Date(`${date}T12:00:00Z`);
  return {
    weekday: dayTabFormatter.format(value),
    day: dayNumberFormatter.format(value),
  };
}

export default function DashboardPage() {
  const weekDays = mockWeeklySummary.days.map((day) => day.date);
  const [selectedDate, setSelectedDate] = useState<ISODate>(weekDays[2]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-base-content/70">
            Your weekly study schedule. All times are shown in Edmonton time.
          </p>
        </div>
        <span className="badge badge-ghost badge-lg">
          Sample data · Nov 16–22, 2026
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeeklyCalendar events={mockEvents} initialDate="2026-11-16" />
        </div>

        <div className="space-y-3">
          <div
            role="tablist"
            aria-label="Choose a day"
            className="grid grid-cols-7 gap-1 rounded-box border border-base-300 bg-base-100 p-1 shadow-sm"
          >
            {weekDays.map((date) => {
              const { weekday, day } = dayLabel(date);
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
                      : "hover:bg-base-200"
                  }`}
                  onClick={() => setSelectedDate(date)}
                >
                  <span className="opacity-80">{weekday}</span>
                  <span className="text-base font-semibold">{day}</span>
                </button>
              );
            })}
          </div>

          <PlanForDay date={selectedDate} events={mockEvents} />
        </div>
      </div>

      <ProgressTracker summary={mockWeeklySummary} />
    </div>
  );
}
