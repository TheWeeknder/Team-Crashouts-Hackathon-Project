import type { ProjectColour, ProjectStatus } from "../types/backend";

// The colours the backend accepts, minus White (it disappears on the
// calendar).
export const COLOUR_OPTIONS: { value: ProjectColour; label: string }[] = [
  { value: "#9575CD", label: "Purple" },
  { value: "#64B5F6", label: "Blue" },
  { value: "#4DB6AC", label: "Teal" },
  { value: "#81C784", label: "Green" },
  { value: "#FFF176", label: "Yellow" },
  { value: "#FFB74D", label: "Orange" },
  { value: "#E57373", label: "Red" },
  { value: "#F06292", label: "Pink" },
];

// The backend stores priority as 0-10 (higher = more important).
export const PRIORITY_OPTIONS = [
  { value: 2, label: "Low" },
  { value: 5, label: "Medium" },
  { value: 8, label: "High" },
  { value: 10, label: "Urgent" },
];

export function priorityLabel(priority: number | null | undefined): string {
  return nearestPriority(priority).label;
}

export function nearestPriority(priority: number | null | undefined) {
  const value = priority ?? 5;
  return PRIORITY_OPTIONS.reduce((best, option) =>
    Math.abs(option.value - value) < Math.abs(best.value - value) ? option : best,
  );
}

export const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "incompleted", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "skipped", label: "Skipped" },
];

export function statusLabel(status: ProjectStatus): string {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}

// Reasons for a day override ("life happens").
export const REASON_OPTIONS = [
  { value: "low_energy", label: "Low energy" },
  { value: "sick", label: "Sick" },
  { value: "emergency", label: "Emergency" },
  { value: "other", label: "Something came up" },
];
