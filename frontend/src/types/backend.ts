// Shapes of the records the Django API (backend/api) returns today.
//
// These follow backend/api/models.py exactly, including its field names
// (`colour`, `recuring`, `active_to`, `day_start_time`). They differ from the
// planned contract in types/api.ts and docs/ROADMAP.md section 4. If the
// backend changes, update this file.
//
// Dates are "YYYY-MM-DD" and times are "HH:MM:SS" strings. Most fields are
// nullable because the models use null=True.

export type ISODate = string
export type ISOTime = string

// What apiFetch throws (ApiError in api/api.js). On a 400, `data` holds the
// field errors, e.g. { title: ["This field is required."] }. A network
// failure is a plain Error with no status.
export interface ApiError extends Error {
  status?: number
  data?: unknown
}

// Fields the server fills in. Never send them.
type ServerFields = 'id' | 'user'

// ---------- Projects (/projects/) ----------

export interface Project {
  id: number
  user: number
  title: string
  course: string
  deadline: ISODate | null
  estimated_hours: number | null
  completed_hours: number | null
  remaining_hours: number | null
  priority: number | null
  // Free text on the backend. Default "Not Started".
  status: string | null
  // Hex color, default "#FFFFFF".
  colour: string | null
}

export type ProjectInput = Partial<Omit<Project, ServerFields>> &
  Pick<Project, 'title' | 'course'>

export interface ProjectListParams {
  status?: string
  // e.g. "deadline", "-priority", "title"
  ordering?: string
}

// ---------- Commitments (/commitments/) ----------

export interface Commitment {
  id: number
  user: number
  title: string
  // "work", "extracurricular", "personal" or "event" (free text)
  kind: string | null
  recuring: boolean | null
  // Free text, e.g. "0,2,4" for Monday, Wednesday, Friday.
  weekdays: string | null
  date: ISODate | null
  start_time: ISOTime | null
  end_time: ISOTime | null
  active_from: ISODate | null
  active_to: ISODate | null
}

export type CommitmentInput = Partial<Omit<Commitment, ServerFields>> &
  Pick<Commitment, 'title'>

export interface CommitmentListParams {
  kind?: string
  date?: ISODate
  ordering?: string
}

// ---------- Planner settings (/planner-settings/) ----------

export interface PlannerSettings {
  id: number
  user: number
  day_start_time: ISOTime | null
  day_end_time: ISOTime | null
  // Free text, e.g. "0,1,2,3,4".
  work_days: string | null
  max_hours_per_day: number | null
  min_block_minutes: number | null
  max_block_minutes: number | null
  break_minutes: number | null
}

export type PlannerSettingsInput = Partial<Omit<PlannerSettings, ServerFields>>

// ---------- Day overrides (/day-overrides/) ----------

export interface DayOverride {
  id: number
  user: number
  date: ISODate | null
  start_time: ISOTime | null
  end_time: ISOTime | null
  reason: string | null
  note: string | null
}

export type DayOverrideInput = Partial<Omit<DayOverride, ServerFields>>

export interface DayOverrideListParams {
  date?: ISODate
  ordering?: string
}

// ---------- Study blocks (/study-blocks/) ----------

export interface StudyBlock {
  id: number
  user: number
  // Project id. Must be one of your own projects.
  project: number
  date: ISODate | null
  start_time: ISOTime | null
  end_time: ISOTime | null
  completed: boolean | null
}

export type StudyBlockInput = Partial<Omit<StudyBlock, ServerFields>> &
  Pick<StudyBlock, 'project'>

export interface StudyBlockListParams {
  project?: number
  date?: ISODate
  completed?: boolean
  ordering?: string
}
