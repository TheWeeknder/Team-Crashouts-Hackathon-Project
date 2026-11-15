import { useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import themePlugin from "@fullcalendar/react/themes/monarch";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/monarch/theme.css";
import "@fullcalendar/react/themes/monarch/palettes/purple.css";

import type { CalendarEvent } from "../types/api";

interface MonthlyCalendarProps {
  events: CalendarEvent[];
  initialDate?: string;
  onEventClick?: (event: CalendarEvent) => void;
}

const plugins = [themePlugin, dayGridPlugin];

const headerToolbar = {
  left: "prev,next today",
  center: "title",
  right: "",
};

export default function MonthlyCalendar({
  events,
  initialDate,
  onEventClick,
}: MonthlyCalendarProps) {
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
    <section aria-label="Monthly study calendar">
      <div className="card overflow-x-auto border border-base-300 bg-base-100 p-4 shadow-sm">
        <div className="min-w-[600px]">
          <FullCalendar
            plugins={plugins}
            initialView="dayGridMonth"
            initialDate={initialDate}
            firstDay={1}
            headerToolbar={headerToolbar}
            events={events}
            eventClick={handleEventClick}
            eventDisplay="block"
            dayMaxEvents={3}
            editable={false}
            height="auto"
          />
        </div>
      </div>
    </section>
  );
}