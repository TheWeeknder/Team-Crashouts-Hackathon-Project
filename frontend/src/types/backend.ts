// Shapes of the records the Django API (backend/api) returns today.
//
// These follow backend/api/models.py exactly, including its field names
// (`colour`, `recuring`, `active_to`, `day_start_time`). Last checked against
// migration 0003_remove_commitment_kind. They differ from the
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

export type ProjectStatus = 'incompleted' | 'in_progress' | 'completed' | 'skipped'

// The backend only accepts these colours (PROJECT_COLOURS in models.py).
export type ProjectColour =
  | '#E57373' // Red
  | '#FFB74D' // Orange
  | '#FFF176' // Yellow
  | '#81C784' // Green
  | '#4DB6AC' // Teal
  | '#64B5F6' // Blue
  | '#9575CD' // Purple
  | '#F06292' // Pink
  | '#FFFFFF' // White

export interface Project {
  id: number
  user: number
  title: string
  deadline: ISODate | null
  estimated_hours: number | null
  completed_hours: number | null
  // Read only: estimated_hours - completed_hours, never below 0.
  remaining_hours: number
  // 0 to 10. The planner treats a higher number as more important.
  priority: number | null
  // Default "in_progress". "completed" and "skipped" are not scheduled.
  status: ProjectStatus
  // Default "#FFFFFF".
  colour: ProjectColour | null
}

export type ProjectInput = Partial<Omit<Project, ServerFields | 'remaining_hours'>> &
  Pick<Project, 'title'>

export interface ProjectListParams {
  status?: ProjectStatus
  // e.g. "deadline", "-priority", "title"
  ordering?: string
}

// ---------- Commitments (/commitments/) ----------

export interface Commitment {
  id: number
  user: number
  title: string
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
  // Inclusive date range.
  date_from?: ISODate
  date_to?: ISODate
  completed?: boolean
  ordering?: string
}

// ---------- Plan generation (POST /planner/generate/) ----------

export interface GeneratePlanInput {
  // The browser's time with its offset, e.g. "2026-11-18T14:30-06:00". The
  // server converts it to America/Edmonton. useGeneratePlan fills it in.
  now?: string
  // If true, the server returns the plan without saving it.
  dry_run?: boolean
}

export interface PlanAlert {
  project: number
  project_title: string
  deadline: ISODate | null
  remaining_hours: number
  // Hours the planner could fit before the deadline.
  available_hours: number
  shortfall_hours: number
  severity: 'warning' | 'critical'
  suggestions: string[]
}

export interface GeneratePlanResponse {
  // The "now" the plan used, as America/Edmonton wall-clock time.
  now: string
  // With dry_run, the blocks have id null.
  blocks: Array<Omit<StudyBlock, 'id'> & { id: number | null }>
  alerts: PlanAlert[]
}

// POST planner/generate/ with alerts_only: a dry run without the blocks.
export type PlanCheckResponse = Omit<GeneratePlanResponse, 'blocks'>
