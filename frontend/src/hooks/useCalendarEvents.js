import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/api';
import { toQueryString } from './resource';

// GET /api/v1/planner/events/: study blocks, commitments (recurring ones
// expanded) and day overrides as CalendarEvent objects (types/api.ts), ready
// for MonthlyCalendar, WeeklyCalendar and PlanForDay.
//
// Usage:
//   const { events } = useCalendarEvents({ start: '2026-11-16', end: '2026-11-23' });
//   <WeeklyCalendar events={events.data ?? []} />
//
// `end` is exclusive. With no range, the server returns the current week.
// The range can be 92 days at most. Refetches after generatePlan and after
// any create, update or delete through the resource hooks.
export default function useCalendarEvents({ start, end } = {}) {
    const events = useQuery({
        queryKey: ['planner', 'events', { start, end }],
        queryFn: () => apiFetch(`planner/events/${toQueryString({ start, end })}`),
    });
    return { events };
}
