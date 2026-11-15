import { useId } from "react";

import type { CalendarEvent, ISODate } from "../types/api";

interface PlanForDayProps {
  date: ISODate;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

const timeZone = "America/Edmonton";

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const headingFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "UTC",
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

function getEdmontonDate(value: number): string {
  const parts = dateKeyFormatter.formatToParts(value);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function formatSelectedDate(date: ISODate): string {
  // Treat this as a calendar date, not an Edmonton timestamp.
  return headingFormatter.format(new Date(`${date}T12:00:00Z`));
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function PlanForDay({
  date,
  events,
  onEventClick,
}: PlanForDayProps) {
  const headingId = useId();

  const dailyEvents = events
    .filter((event) => {
      const start = Date.parse(event.start);
      const end = Date.parse(event.end);

      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return false;
      }

      // End is exclusive: an event ending at midnight does not
      // also belong to the following day.
      const startDate = getEdmontonDate(start);
      const lastDate = getEdmontonDate(end - 1);

      return startDate <= date && date <= lastDate;
    })
    .sort(
      (first, second) =>
        Date.parse(first.start) - Date.parse(second.start),
    );

  return (
    <section
      aria-labelledby={headingId}
      className="card border border-base-300 bg-base-100 p-5 shadow-sm"
    >
      <header className="mb-5">
        <h2 id={headingId} className="text-xl font-semibold">
          Plan for the day
        </h2>

        <p className="mt-1 text-sm text-base-content/70">
          <time dateTime={date}>{formatSelectedDate(date)}</time>
        </p>

        <p className="mt-1 text-xs text-base-content/50">
          All times shown in Edmonton time.
        </p>
      </header>

      {dailyEvents.length === 0 ? (
        <div className="rounded-box bg-base-200 px-4 py-8 text-center">
          <p className="font-medium">Nothing scheduled</p>
          <p className="mt-1 text-sm text-base-content/70">
            No study sessions or commitments are scheduled for this day.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {dailyEvents.map((event) => {
            const startsEarlier =
              getEdmontonDate(Date.parse(event.start)) < date;

            const endsLater =
              getEdmontonDate(Date.parse(event.end) - 1) > date;

            const details = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{event.title}</h3>

                  <span className="badge badge-ghost badge-sm shrink-0">
                    {event.type === "study"
                      ? "Study"
                      : event.kind
                        ? formatLabel(event.kind)
                        : "Commitment"}
                  </span>
                </div>

                <p className="mt-2 text-sm text-base-content/70">
                  {startsEarlier ? (
                    "Continues from previous day"
                  ) : (
                    <time dateTime={event.start}>
                      {timeFormatter.format(new Date(event.start))}
                    </time>
                  )}

                  {" – "}

                  {endsLater ? (
                    "Continues into next day"
                  ) : (
                    <time dateTime={event.end}>
                      {timeFormatter.format(new Date(event.end))}
                    </time>
                  )}
                </p>

                {event.type === "study" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="badge badge-primary badge-soft badge-sm">
                      {formatLabel(event.status)}
                    </span>

                    {event.locked && (
                      <span className="badge badge-ghost badge-sm">
                        Locked
                      </span>
                    )}
                  </div>
                )}
              </>
            );

            const cardClassName =
              "block w-full rounded-field border border-base-300 bg-base-100 " +
              "border-l-4 p-4 text-left";

            return (
              <li key={event.id}>
                {onEventClick ? (
                  <button
                    type="button"
                    className={`${cardClassName} transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
                    style={{ borderLeftColor: event.color }}
                    onClick={() => onEventClick(event)}
                    aria-label={`View details for ${event.title}`}
                  >
                    {details}
                  </button>
                ) : (
                  <div
                    className={cardClassName}
                    style={{ borderLeftColor: event.color }}
                  >
                    {details}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}