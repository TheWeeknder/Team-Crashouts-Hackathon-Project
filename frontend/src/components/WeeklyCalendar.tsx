import { useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import themePlugin from "@fullcalendar/react/themes/monarch";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/monarch/theme.css";
import "@fullcalendar/react/themes/monarch/palettes/purple.css";

import type { CalendarEvent } from "../types/api";

interface WeeklyCalendarProps {
  events: CalendarEvent[];
  initialDate?: string;
  onEventClick?: (event: CalendarEvent) => void;
}

const plugins = [themePlugin, timeGridPlugin];

const headerToolbar = {
  left: "prev,next today",
  center: "title",
  right: "",
};

export default function WeeklyCalendar({
  events,
  initialDate,
  onEventClick,
}: WeeklyCalendarProps) {
  const handleEventClick = useCallback(
    (info: { event: { id: string } }) => {
      const selectedEvent = events.find(
        (event) => event.id === info.event.id,
      );

      if (selectedEvent) {
        onEventClick?.(selectedEvent);
      }
    },
    [events, onEventClick],
  );

  return (
    <section aria-label="Weekly study calendar">
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-4">
        <div className="min-w-[700px]">
          <FullCalendar
            plugins={plugins}
            initialView="timeGridWeek"
            initialDate={initialDate}
            timeZone="America/Edmonton"
            firstDay={1}
            headerToolbar={headerToolbar}
            events={events}
            eventClick={handleEventClick}
            editable={false}
            allDaySlot={false}
            slotMinTime="06:00:00"
            slotMaxTime="23:00:00"
            slotDuration="00:30:00"
            scrollTime="09:00:00"
            nowIndicator
            displayEventEnd
            height={650}
            dayHeaderFormat={{
              weekday: "short",
              month: "short",
              day: "numeric",
            }}
            eventTimeFormat={{
              hour: "numeric",
              minute: "2-digit",
              meridiem: "short",
            }}
          />
        </div>
      </div>
    </section>
  );
}