// frontend/src/types/api.ts

// Date/time strings received from the API.
// Examples:
// Date:     "2026-11-20"
// Time:     "09:00:00"
// DateTime: "2026-11-20T14:00:00-07:00"
export type ISODate = string;
export type ISOTime = string;
export type ISODateTime = string;

// Monday = 0, Sunday = 6
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// ---------- Tasks ----------

export type TaskPriority = 1 | 2 | 3;

export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: number;
  title: string;
  course?: string;
  deadline: ISODateTime;
  estimated_hours: number;
  completed_hours: number;
  remaining_hours: number;
  priority: TaskPriority;
  status: TaskStatus;
  color?: string;
}

// ---------- Commitments ----------

export type CommitmentKind =
  | "work"
  | "extracurricular"
  | "personal"
  | "event"
  | "unavailable";

export interface Commitment {
  id: number;
  title: string;
  kind: CommitmentKind;
  recurring: boolean;
  weekdays: Weekday[];
  date: ISODate | null;
  start_time: ISOTime;
  end_time: ISOTime;
  active_from?: ISODate | null;
  active_until?: ISODate | null;
}

// ---------- Planner settings ----------

export interface PlannerSettings {
  day_start: ISOTime;
  day_end: ISOTime;
  work_days: Weekday[];
  max_hours_per_day: number;
  min_block_minutes: number;
  max_block_minutes: number;
  break_minutes: number;
}

// ---------- Day overrides ----------

export type DayOverrideReason =
  | "low_energy"
  | "sick"
  | "emergency"
  | "other";

export interface DayOverride {
  date: ISODate;
  max_hours: number;
  reason: DayOverrideReason;
  note?: string;
}

// ---------- Study blocks ----------

export type BlockStatus = "planned" | "done" | "missed";

export interface StudyBlock {
  id: number;
  task: number;
  start: ISODateTime;
  end: ISODateTime;
  status: BlockStatus;
  locked: boolean;
}

// ---------- Feasibility alerts ----------

export type AlertSeverity = "warning" | "critical";

export interface Alert {
  task_id: number;
  task_title: string;
  deadline: ISODateTime;
  remaining_hours: number;
  available_hours: number;
  shortfall_hours: number;
  severity: AlertSeverity;
  suggestions: string[];
}

// ---------- Calendar events ----------

interface CalendarEventBase {
  id: string;
  title: string;
  // Local wall-clock times without an offset, e.g. "2026-11-20T14:00:00".
  start: ISODateTime;
  end: ISODateTime;
  color: string;
  // Text colour FullCalendar uses on top of `color`.
  contrastColor?: string;
  allDay?: boolean;
  // Id of the backend record this event came from (study block,
  // commitment, day override or project).
  record_id?: number;
}

export interface StudyCalendarEvent extends CalendarEventBase {
  type: "study";
  task_id: number;
  status: BlockStatus;
  locked: boolean;
  kind: null;
}

export interface CommitmentCalendarEvent extends CalendarEventBase {
  type: "commitment";
  task_id: null;
  status: null;
  locked: null;
  // The backend dropped Commitment.kind, so real data has null here.
  // "unavailable" marks time blocked by a day override.
  kind: CommitmentKind | null;
}

// A project's deadline, shown as an all-day event on its due date.
export interface DeadlineCalendarEvent extends CalendarEventBase {
  type: "deadline";
  task_id: number;
  status: null;
  locked: null;
  kind: null;
}

export type CalendarEvent =
  | StudyCalendarEvent
  | CommitmentCalendarEvent
  | DeadlineCalendarEvent;

// ---------- Weekly dashboard ----------

export interface WeeklyDaySummary {
  date: ISODate;
  capacity_hours: number;
  planned_hours: number;
  done_hours: number;
}

export interface WeeklyTaskSummary {
  task_id: number;
  title: string;
  deadline: ISODateTime | null;
  estimated_hours: number;
  completed_hours: number;
  percent: number;
  at_risk: boolean;
}

export interface WeeklySummary {
  week_start: ISODate;
  planned_hours: number;
  done_hours: number;
  missed_hours: number;
  days: WeeklyDaySummary[];
  tasks: WeeklyTaskSummary[];
}

// ---------- Planner API responses ----------

export interface GeneratePlanResponse {
  blocks: StudyBlock[];
  alerts: Alert[];
}