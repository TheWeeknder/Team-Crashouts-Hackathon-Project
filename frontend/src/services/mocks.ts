// frontend/src/services/mocks.ts

import type {
  Alert,
  CalendarEvent,
  Task,
  WeeklySummary,
} from "../types/api";

export const mockTasks: Task[] = [
  {
    id: 1,
    title: "Capstone report",
    course: "Capstone",
    deadline: "2026-11-20T23:59:00-07:00",
    estimated_hours: 10,
    completed_hours: 3,
    remaining_hours: 7,
    priority: 1,
    status: "in_progress",
    color: "#7c3aed",
  },
  {
    id: 2,
    title: "Math assignment",
    course: "Math",
    deadline: "2026-11-23T23:59:00-07:00",
    estimated_hours: 4,
    completed_hours: 0,
    remaining_hours: 4,
    priority: 2,
    status: "todo",
    color: "#2563eb",
  },
  {
    id: 3,
    title: "Reading notes",
    course: "English",
    deadline: "2026-11-26T23:59:00-07:00",
    estimated_hours: 3,
    completed_hours: 1,
    remaining_hours: 2,
    priority: 3,
    status: "in_progress",
    color: "#059669",
  },
];

export const mockEvents: CalendarEvent[] = [
  // Monday
  {
    id: "block-1",
    type: "study",
    title: "Capstone report",
    start: "2026-11-16T09:00:00-07:00",
    end: "2026-11-16T11:00:00-07:00",
    task_id: 1,
    status: "done",
    locked: false,
    kind: null,
    color: "#7c3aed",
  },
  {
    id: "commitment-1-2026-11-16",
    type: "commitment",
    title: "Basketball practice",
    start: "2026-11-16T17:00:00-07:00",
    end: "2026-11-16T19:00:00-07:00",
    task_id: null,
    status: null,
    locked: null,
    kind: "extracurricular",
    color: "#f59e0b",
  },

  // Tuesday
  {
    id: "block-2",
    type: "study",
    title: "Capstone report",
    start: "2026-11-17T09:00:00-07:00",
    end: "2026-11-17T10:00:00-07:00",
    task_id: 1,
    status: "done",
    locked: false,
    kind: null,
    color: "#7c3aed",
  },
  {
    id: "commitment-2-2026-11-17",
    type: "commitment",
    title: "Work shift",
    start: "2026-11-17T13:00:00-07:00",
    end: "2026-11-17T19:00:00-07:00",
    task_id: null,
    status: null,
    locked: null,
    kind: "work",
    color: "#64748b",
  },

  // Wednesday
  {
    id: "commitment-3-2026-11-18",
    type: "commitment",
    title: "Dentist",
    start: "2026-11-18T10:00:00-07:00",
    end: "2026-11-18T11:00:00-07:00",
    task_id: null,
    status: null,
    locked: null,
    kind: "event",
    color: "#e11d48",
  },
  {
    id: "block-3",
    type: "study",
    title: "Capstone report",
    start: "2026-11-18T11:00:00-07:00",
    end: "2026-11-18T13:00:00-07:00",
    task_id: 1,
    status: "planned",
    locked: false,
    kind: null,
    color: "#7c3aed",
  },
  {
    id: "commitment-1-2026-11-18",
    type: "commitment",
    title: "Basketball practice",
    start: "2026-11-18T17:00:00-07:00",
    end: "2026-11-18T19:00:00-07:00",
    task_id: null,
    status: null,
    locked: null,
    kind: "extracurricular",
    color: "#f59e0b",
  },

  // Thursday
  {
    id: "block-4",
    type: "study",
    title: "Capstone report",
    start: "2026-11-19T09:00:00-07:00",
    end: "2026-11-19T11:00:00-07:00",
    task_id: 1,
    status: "planned",
    locked: true,
    kind: null,
    color: "#7c3aed",
  },
  {
    id: "commitment-2-2026-11-19",
    type: "commitment",
    title: "Work shift",
    start: "2026-11-19T13:00:00-07:00",
    end: "2026-11-19T19:00:00-07:00",
    task_id: null,
    status: null,
    locked: null,
    kind: "work",
    color: "#64748b",
  },

  // Friday
  {
    id: "block-5",
    type: "study",
    title: "Capstone report",
    start: "2026-11-20T09:00:00-07:00",
    end: "2026-11-20T10:00:00-07:00",
    task_id: 1,
    status: "planned",
    locked: false,
    kind: null,
    color: "#7c3aed",
  },

  // Saturday
  {
    id: "block-6",
    type: "study",
    title: "Math assignment",
    start: "2026-11-21T09:00:00-07:00",
    end: "2026-11-21T11:00:00-07:00",
    task_id: 2,
    status: "planned",
    locked: false,
    kind: null,
    color: "#2563eb",
  },

  // Sunday
  {
    id: "block-7",
    type: "study",
    title: "Math assignment",
    start: "2026-11-22T09:00:00-07:00",
    end: "2026-11-22T11:00:00-07:00",
    task_id: 2,
    status: "planned",
    locked: false,
    kind: null,
    color: "#2563eb",
  },
  {
    id: "block-8",
    type: "study",
    title: "Reading notes",
    start: "2026-11-22T11:15:00-07:00",
    end: "2026-11-22T12:15:00-07:00",
    task_id: 3,
    status: "done",
    locked: false,
    kind: null,
    color: "#059669",
  },
];

export const mockAlerts: Alert[] = [
  {
    task_id: 1,
    task_title: "Capstone report",
    deadline: "2026-11-20T23:59:00-07:00",
    remaining_hours: 7,
    available_hours: 5,
    shortfall_hours: 2,
    severity: "warning",
    suggestions: [
      "Add 2 hours of study capacity before the deadline.",
      "Ask for an extension or reduce the project scope.",
    ],
  },
];

// Fixture convention: planned_hours counts blocks still marked "planned".
// Confirm this interpretation with Cody before live integration.
export const mockWeeklySummary: WeeklySummary = {
  week_start: "2026-11-16",
  planned_hours: 9,
  done_hours: 4,
  missed_hours: 0,
  days: [
    {
      date: "2026-11-16",
      capacity_hours: 6,
      planned_hours: 0,
      done_hours: 2,
    },
    {
      date: "2026-11-17",
      capacity_hours: 4,
      planned_hours: 0,
      done_hours: 1,
    },
    {
      date: "2026-11-18",
      capacity_hours: 6,
      planned_hours: 2,
      done_hours: 0,
    },
    {
      date: "2026-11-19",
      capacity_hours: 4,
      planned_hours: 2,
      done_hours: 0,
    },
    {
      date: "2026-11-20",
      capacity_hours: 6,
      planned_hours: 1,
      done_hours: 0,
    },
    {
      date: "2026-11-21",
      capacity_hours: 6,
      planned_hours: 2,
      done_hours: 0,
    },
    {
      date: "2026-11-22",
      capacity_hours: 6,
      planned_hours: 2,
      done_hours: 1,
    },
  ],
  tasks: mockTasks.map((task) => ({
    task_id: task.id,
    title: task.title,
    deadline: task.deadline,
    estimated_hours: task.estimated_hours,
    completed_hours: task.completed_hours,
    percent: Math.round(
      (task.completed_hours / task.estimated_hours) * 100,
    ),
    at_risk: mockAlerts.some((alert) => alert.task_id === task.id),
  })),
};