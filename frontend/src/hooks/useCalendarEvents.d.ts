// Types for useCalendarEvents.js, so TypeScript files can import it.
import type { UseQueryResult } from '@tanstack/react-query'
import type { CalendarEvent, ISODate } from '../types/api'
import type { ApiError } from '../types/backend'

export default function useCalendarEvents(range?: { start?: ISODate; end?: ISODate }): {
  events: UseQueryResult<CalendarEvent[], ApiError>
}
