import { useState, type ReactNode } from "react";

import ConfirmDialog from "../components/ConfirmDialog";
import Modal from "../components/Modal";
import CommitmentForm from "../components/forms/CommitmentForm";
import DayOverrideForm from "../components/forms/DayOverrideForm";
import useCommitments from "../hooks/useCommitments";
import useDayOverrides from "../hooks/useDayOverrides";
import usePlanStatus from "../hooks/usePlanStatus";
import usePlannerSettings from "../hooks/usePlannerSettings";
import { WEEKDAYS, formatDate, formatTime, parseWeekdays, todayISO } from "../lib/dates";
import { formatReason } from "../lib/events";
import type { Commitment, DayOverride } from "../types/backend";

type Dialog =
  | { kind: "add-commitment" }
  | { kind: "edit-commitment"; commitment: Commitment }
  | { kind: "delete-commitment"; commitment: Commitment }
  | { kind: "add-override" }
  | { kind: "edit-override"; override: DayOverride }
  | { kind: "delete-override"; override: DayOverride }
  | null;

function timeRange(start: string | null, end: string | null) {
  if (!start && !end) return "All day";
  return `${formatTime(start) || "Start of day"} – ${formatTime(end) || "End of day"}`;
}

function weekdayList(text: string | null) {
  const days = parseWeekdays(text);
  if (days.length === 7) return "Every day";
  if (days.join(",") === "0,1,2,3,4") return "Weekdays";
  if (days.join(",") === "5,6") return "Weekends";
  return days.map((d) => WEEKDAYS[d].short).join(", ");
}

interface SchedulePageProps {
  onOpenSettings: () => void;
}

export default function SchedulePage({ onOpenSettings }: SchedulePageProps) {
  const { commitments, deleteCommitment } = useCommitments();
  const { dayOverrides, deleteDayOverride } = useDayOverrides();
  const { settings } = usePlannerSettings();
  const { markStale } = usePlanStatus();
  const [dialog, setDialog] = useState<Dialog>(null);

  const allCommitments = commitments.data ?? [];
  const weekly = allCommitments.filter((c) => c.recuring);
  const today = todayISO();
  const oneTime = allCommitments
    .filter((c) => !c.recuring)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  const upcomingOneTime = oneTime.filter((c) => !c.date || c.date >= today);
  const timeOff = (dayOverrides.data ?? [])
    .filter((o) => !o.date || o.date >= today)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));

  const s = settings.data;
  const studyDays = weekdayList(s?.work_days || "0,1,2,3,4,5,6");

  const close = () => {
    setDialog(null);
    deleteCommitment.reset();
    deleteDayOverride.reset();
  };

  const error = commitments.error ?? dayOverrides.error ?? settings.error;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="mt-1 text-base-content/70">
            Everything that isn't study time. The planner works around all of it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-soft btn-error" onClick={() => setDialog({ kind: "add-override" })}>
            + Time off
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setDialog({ kind: "add-commitment" })}>
            + Add commitment
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="alert alert-error alert-soft">
          Could not load your schedule: {error.message}
        </div>
      )}

      {/* Study hours summary */}
      <section className="card border border-base-300 bg-gradient-to-r from-primary/10 to-secondary/10 shadow-sm">
        <div className="card-body flex-row flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="card-title">Your study hours</h2>
            {settings.isPending ? (
              <div className="skeleton mt-2 h-4 w-64" />
            ) : (
              <p className="text-sm text-base-content/70">
                {studyDays}, {formatTime(s?.day_start_time || "09:00")} – {formatTime(s?.day_end_time || "19:00")} ·
                up to {s?.max_hours_per_day || 6} h a day · sessions of {s?.min_block_minutes || 30}–
                {s?.max_block_minutes || 120} min with {s?.break_minutes ?? 15} min breaks
                {!s && <span className="ml-1 italic">(defaults)</span>}
              </p>
            )}
          </div>
          <button type="button" className="btn btn-sm" onClick={onOpenSettings}>
            Edit study hours
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <ScheduleSection
          title="Every week"
          subtitle="Recurring shifts, classes and practice."
          loading={commitments.isPending}
          empty="No weekly commitments yet."
          onAdd={() => setDialog({ kind: "add-commitment" })}
        >
          {weekly.map((c) => (
            <ScheduleRow
              key={c.id}
              title={c.title}
              detail={`${weekdayList(c.weekdays)} · ${timeRange(c.start_time, c.end_time)}`}
              extra={
                c.active_from || c.active_to
                  ? `${c.active_from ? `From ${formatDate(c.active_from)}` : ""}${c.active_from && c.active_to ? " " : ""}${
                      c.active_to ? `until ${formatDate(c.active_to)}` : ""
                    }`
                  : undefined
              }
              accent="bg-slate-500"
              onEdit={() => setDialog({ kind: "edit-commitment", commitment: c })}
              onDelete={() => setDialog({ kind: "delete-commitment", commitment: c })}
            />
          ))}
        </ScheduleSection>

        <ScheduleSection
          title="One-time events"
          subtitle="Appointments, events, anything on a single date."
          loading={commitments.isPending}
          empty="No upcoming one-time events."
          onAdd={() => setDialog({ kind: "add-commitment" })}
        >
          {upcomingOneTime.map((c) => (
            <ScheduleRow
              key={c.id}
              title={c.title}
              detail={`${formatDate(c.date)} · ${timeRange(c.start_time, c.end_time)}`}
              accent="bg-slate-400"
              onEdit={() => setDialog({ kind: "edit-commitment", commitment: c })}
              onDelete={() => setDialog({ kind: "delete-commitment", commitment: c })}
            />
          ))}
        </ScheduleSection>

        <ScheduleSection
          title="Time off"
          subtitle="Days or hours you can't study: sick, low energy, emergencies."
          loading={dayOverrides.isPending}
          empty="No upcoming time off."
          onAdd={() => setDialog({ kind: "add-override" })}
          addLabel="+ Time off"
        >
          {timeOff.map((o) => (
            <ScheduleRow
              key={o.id}
              title={formatReason(o.reason)}
              detail={`${formatDate(o.date)} · ${timeRange(o.start_time, o.end_time)}`}
              extra={o.note || undefined}
              accent="bg-rose-500"
              onEdit={() => setDialog({ kind: "edit-override", override: o })}
              onDelete={() => setDialog({ kind: "delete-override", override: o })}
            />
          ))}
        </ScheduleSection>
      </div>

      <Modal
        open={dialog?.kind === "add-commitment"}
        onClose={close}
        title="Add a commitment"
        description="The planner won't schedule study during this time."
      >
        <CommitmentForm onDone={close} />
      </Modal>
      <Modal open={dialog?.kind === "edit-commitment"} onClose={close} title="Edit commitment">
        {dialog?.kind === "edit-commitment" && <CommitmentForm commitment={dialog.commitment} onDone={close} />}
      </Modal>
      <Modal
        open={dialog?.kind === "add-override"}
        onClose={close}
        title="Add time off"
        description="Block off time and the planner moves your sessions."
      >
        <DayOverrideForm onDone={close} />
      </Modal>
      <Modal open={dialog?.kind === "edit-override"} onClose={close} title="Edit time off">
        {dialog?.kind === "edit-override" && <DayOverrideForm override={dialog.override} onDone={close} />}
      </Modal>

      <ConfirmDialog
        open={dialog?.kind === "delete-commitment"}
        title="Delete this commitment?"
        message={dialog?.kind === "delete-commitment" ? `"${dialog.commitment.title}" will be removed from your schedule.` : ""}
        isPending={deleteCommitment.isPending}
        error={deleteCommitment.error?.message}
        onClose={close}
        onConfirm={() => {
          if (dialog?.kind !== "delete-commitment") return;
          deleteCommitment.mutate(dialog.commitment.id, {
            onSuccess: () => {
              markStale();
              close();
            },
          });
        }}
      />
      <ConfirmDialog
        open={dialog?.kind === "delete-override"}
        title="Delete this time off?"
        message="The planner will be able to schedule study during this time again."
        isPending={deleteDayOverride.isPending}
        error={deleteDayOverride.error?.message}
        onClose={close}
        onConfirm={() => {
          if (dialog?.kind !== "delete-override") return;
          deleteDayOverride.mutate(dialog.override.id, {
            onSuccess: () => {
              markStale();
              close();
            },
          });
        }}
      />
    </div>
  );
}

function ScheduleSection({
  title,
  subtitle,
  loading,
  empty,
  onAdd,
  addLabel = "+ Add",
  children,
}: {
  title: string;
  subtitle: string;
  loading: boolean;
  empty: string;
  onAdd: () => void;
  addLabel?: string;
  children: ReactNode[];
}) {
  return (
    <section className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="card-title text-lg">{title}</h2>
            <p className="text-sm text-base-content/60">{subtitle}</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onAdd}>
            {addLabel}
          </button>
        </div>
        {loading ? (
          <div className="space-y-2">
            <div className="skeleton h-14 w-full" />
            <div className="skeleton h-14 w-full" />
          </div>
        ) : children.length === 0 ? (
          <p className="rounded-box bg-base-200 px-4 py-6 text-center text-sm text-base-content/60">{empty}</p>
        ) : (
          <ul className="space-y-2">{children}</ul>
        )}
      </div>
    </section>
  );
}

function ScheduleRow({
  title,
  detail,
  extra,
  accent,
  onEdit,
  onDelete,
}: {
  title: string;
  detail: string;
  extra?: string;
  accent: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-field border border-base-300 p-3">
      <span className={`h-10 w-1 shrink-0 rounded-full ${accent}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{title}</p>
        <p className="text-sm text-base-content/60">{detail}</p>
        {extra && <p className="truncate text-xs text-base-content/50">{extra}</p>}
      </div>
      <button type="button" className="btn btn-ghost btn-xs" onClick={onEdit} aria-label={`Edit ${title}`}>
        Edit
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-xs text-error"
        onClick={onDelete}
        aria-label={`Delete ${title}`}
      >
        Delete
      </button>
    </li>
  );
}
