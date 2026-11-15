// Turns the records the backend returns (types/backend.ts) into the shapes
// the calendar and dashboard components use (types/api.ts). This is
// decision D1/D2 in docs/ROADMAP.md, done on the client.

import type {
  BlockStatus,
  CalendarEvent,
  WeeklyDaySummary,
  WeeklySummary,
  WeeklyTaskSummary,
} from "../types/api";
import type {
  Commitment,
  DayOverride,
  ISODate,
  PlanAlert,
  PlannerSettings,
  Project,
  StudyBlock,
} from "../types/backend";
import {
  addDays,
  localDateTime,
  parseWeekdays,
  timeToMinutes,
  todayISO,
  weekdayOf,
} from "./dates";

// ---------- Colours ----------

export const DEFAULT_PROJECT_COLOUR = "#9575CD";
const COMMITMENT_COLOUR = "#64748B";
const UNAVAILABLE_COLOUR = "#E11D48";
const DEADLINE_COLOUR = "#D97706";

// White (the backend default) would vanish on the calendar, so swap it.
export function displayColour(colour: string | null | undefined): string {
  if (!colour || colour.toUpperCase() === "#FFFFFF") return DEFAULT_PROJECT_COLOUR;
  return colour;
}

// Dark text on light colours (yellow, orange...), white text on dark ones.
export function contrastText(hex: string): string {
  const value = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  return luminance > 0.45 ? "#1F2937" : "#FFFFFF";
}

// ---------- Helpers ----------

const DONE_STATUSES = new Set(["completed", "skipped"]);

export function isProjectOpen(project: Project): boolean {
  return !DONE_STATUSES.has(project.status);
}

function blockMinutes(block: StudyBlock): number {
  if (!block.start_time || !block.end_time) return 0;
  return Math.max(0, timeToMinutes(block.end_time) - timeToMinutes(block.start_time));
}

export function blockHours(block: StudyBlock): number {
  return blockMinutes(block) / 60;
}

export function blockStatus(block: StudyBlock, now = new Date()): BlockStatus {
  if (block.completed) return "done";
  if (block.date && block.end_time) {
    const end = Date.parse(localDateTime(block.date, block.end_time));
    if (end < now.getTime()) return "missed";
  }
  return "planned";
}

function inRange(day: ISODate, start: ISODate, end: ISODate) {
  return day >= start && day <= end;
}

// A time range on one day; a missing time means start or end of day
// (same rule as the backend scheduler's _span).
function span(day: ISODate, start: string | null, end: string | null) {
  return {
    start: localDateTime(day, start ?? "00:00:00"),
    end: end ? localDateTime(day, end) : localDateTime(addDays(day, 1), "00:00:00"),
  };
}

function wholeDay(day: ISODate) {
  return {
    start: localDateTime(day, "00:00:00"),
    end: localDateTime(addDays(day, 1), "00:00:00"),
    allDay: true,
  };
}

function commitmentOccursOn(c: Commitment, day: ISODate): boolean {
  if (c.active_from && day < c.active_from) return false;
  if (c.active_to && day > c.active_to) return false;
  if (c.recuring) return parseWeekdays(c.weekdays).includes(weekdayOf(day));
  return c.date === day;
}

export function formatReason(reason: string | null | undefined): string {
  if (!reason) return "Unavailable";
  return reason
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ---------- Calendar events ----------

export interface EventSources {
  projects: Project[];
  blocks: StudyBlock[];
  commitments: Commitment[];
  overrides: DayOverride[];
}

// All events between rangeStart and rangeEnd (inclusive dates). Recurring
// commitments are expanded to one event per day.
export function buildCalendarEvents(
  { projects, blocks, commitments, overrides }: EventSources,
  rangeStart: ISODate,
  rangeEnd: ISODate,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const now = new Date();

  for (const block of blocks) {
    if (!block.date || !block.start_time || !block.end_time) continue;
    if (!inRange(block.date, rangeStart, rangeEnd)) continue;
    const project = projectById.get(block.project);
    const color = displayColour(project?.colour);
    events.push({
      id: `block-${block.id}`,
      record_id: block.id,
      type: "study",
      title: project?.title ?? "Study session",
      start: localDateTime(block.date, block.start_time),
      end: localDateTime(block.date, block.end_time),
      task_id: block.project,
      status: blockStatus(block, now),
      locked: false,
      kind: null,
      color,
      contrastColor: contrastText(color),
    });
  }

  for (let day = rangeStart; day <= rangeEnd; day = addDays(day, 1)) {
    for (const c of commitments) {
      if (!commitmentOccursOn(c, day)) continue;
      const times =
        !c.start_time && !c.end_time ? wholeDay(day) : span(day, c.start_time, c.end_time);
      events.push({
        id: `commitment-${c.id}-${day}`,
        record_id: c.id,
        type: "commitment",
        title: c.title,
        ...times,
        task_id: null,
        status: null,
        locked: null,
        kind: null,
        color: COMMITMENT_COLOUR,
        contrastColor: "#FFFFFF",
      });
    }
  }

  for (const o of overrides) {
    if (!o.date || !inRange(o.date, rangeStart, rangeEnd)) continue;
    const times =
      !o.start_time && !o.end_time ? wholeDay(o.date) : span(o.date, o.start_time, o.end_time);
    events.push({
      id: `override-${o.id}`,
      record_id: o.id,
      type: "commitment",
      title: `Unavailable: ${formatReason(o.reason)}`,
      ...times,
      task_id: null,
      status: null,
      locked: null,
      kind: "unavailable",
      color: UNAVAILABLE_COLOUR,
      contrastColor: "#FFFFFF",
    });
  }

  for (const p of projects) {
    if (!p.deadline || !inRange(p.deadline, rangeStart, rangeEnd)) continue;
    events.push({
      id: `deadline-${p.id}`,
      record_id: p.id,
      type: "deadline",
      title: `Due: ${p.title}`,
      ...wholeDay(p.deadline),
      task_id: p.id,
      status: null,
      locked: null,
      kind: null,
      color: DEADLINE_COLOUR,
      contrastColor: "#FFFFFF",
    });
  }

  return events;
}

// ---------- Weekly summary ----------

const DEFAULT_MAX_HOURS = 6;

export function buildWeeklySummary(
  {
    projects,
    blocks,
    settings,
    alerts = [],
  }: {
    projects: Project[];
    blocks: StudyBlock[];
    settings: PlannerSettings | null;
    alerts?: PlanAlert[];
  },
  weekStart: ISODate,
): WeeklySummary {
  const weekEnd = addDays(weekStart, 6);
  const now = new Date();
  const today = todayISO();
  const workDays = parseWeekdays(settings?.work_days);
  const maxHours = settings?.max_hours_per_day || DEFAULT_MAX_HOURS;

  const days: WeeklyDaySummary[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const works = workDays.length === 0 || workDays.includes(i);
    return { date, capacity_hours: works ? maxHours : 0, planned_hours: 0, done_hours: 0 };
  });

  let planned = 0;
  let done = 0;
  let missed = 0;
  for (const block of blocks) {
    if (!block.date || !inRange(block.date, weekStart, weekEnd)) continue;
    const hours = blockHours(block);
    const day = days[weekdayOf(block.date)];
    const status = blockStatus(block, now);
    if (status === "done") {
      done += hours;
      day.done_hours += hours;
    } else if (status === "missed") {
      missed += hours;
    } else {
      planned += hours;
      day.planned_hours += hours;
    }
  }

  const alerted = new Set(alerts.map((a) => a.project));
  const tasks: WeeklyTaskSummary[] = projects
    .filter((p) => p.status !== "skipped")
    .sort((a, b) => {
      const doneA = a.status === "completed" ? 1 : 0;
      const doneB = b.status === "completed" ? 1 : 0;
      if (doneA !== doneB) return doneA - doneB;
      return (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999");
    })
    .map((p) => {
      const estimated = p.estimated_hours ?? 0;
      const completed = p.completed_hours ?? 0;
      const percent =
        estimated > 0 ? (completed / estimated) * 100 : p.status === "completed" ? 100 : 0;
      const overdue =
        !!p.deadline && p.deadline < today && p.remaining_hours > 0 && isProjectOpen(p);
      return {
        task_id: p.id,
        title: p.title,
        // Deadlines are dates; treat them as due at the end of the day.
        deadline: p.deadline ? localDateTime(p.deadline, "23:59:00") : null,
        estimated_hours: estimated,
        completed_hours: completed,
        percent,
        at_risk: isProjectOpen(p) && (alerted.has(p.id) || overdue),
      };
    });

  return {
    week_start: weekStart,
    planned_hours: planned,
    done_hours: done,
    missed_hours: missed,
    days,
    tasks,
  };
}
