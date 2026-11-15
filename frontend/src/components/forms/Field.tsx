import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  errorId?: string;
  children: ReactNode;
}

// A labelled form control with an optional hint and error message.
export function Field({ label, htmlFor, error, hint, errorId, children }: FieldProps) {
  return (
    <div className="fieldset gap-1 py-0">
      <label htmlFor={htmlFor} className="fieldset-legend pb-0.5 text-sm">
        {label}
      </label>
      {children}
      {error ? (
        <p id={errorId} className="text-xs text-error">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-base-content/50">{hint}</p>
      )}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="alert alert-error alert-soft text-sm">
      {message}
    </div>
  );
}

interface FormActionsProps {
  onCancel: () => void;
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
}

export function FormActions({ onCancel, submitLabel, pendingLabel, isPending }: FormActionsProps) {
  return (
    <div className="modal-action mt-2">
      <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={isPending}>
        Cancel
      </button>
      <button type="submit" className="btn btn-primary" disabled={isPending}>
        {isPending && <span className="loading loading-spinner loading-sm" />}
        {isPending ? pendingLabel : submitLabel}
      </button>
    </div>
  );
}

interface WeekdayPickerProps {
  value: number[];
  onChange: (days: number[]) => void;
  disabled?: boolean;
  invalid?: boolean;
  labelledBy?: string;
}

// Seven toggle chips, Monday first. Values use the backend's Mon = 0.
export function WeekdayPicker({ value, onChange, disabled, invalid, labelledBy }: WeekdayPickerProps) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      aria-invalid={invalid || undefined}
      className="flex flex-wrap gap-1.5"
    >
      {days.map((label, day) => {
        const on = value.includes(day);
        return (
          <button
            key={label}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            className={`btn btn-sm min-w-12 ${on ? "btn-primary" : "btn-outline"} ${
              invalid && !on ? "btn-error" : ""
            }`}
            onClick={() =>
              onChange(on ? value.filter((d) => d !== day) : [...value, day].sort((a, b) => a - b))
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
