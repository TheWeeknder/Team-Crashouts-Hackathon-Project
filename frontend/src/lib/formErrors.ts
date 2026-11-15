import type { ApiError } from "../types/backend";

// Django REST Framework sends 400 errors as { field: ["message", ...] }.
// Errors for fields the form shows go next to their input; the rest are
// joined into one general message.
export function splitServerErrors<F extends string>(
  error: ApiError | null | undefined,
  fields: readonly F[],
): { fields: Partial<Record<F, string>>; general: string | null } {
  if (!error) return { fields: {}, general: null };
  const { data } = error;
  if (error.status !== 400 || !data || typeof data !== "object") {
    return {
      fields: {},
      general: error.status ? error.message : "Could not reach the server. Is the backend running?",
    };
  }
  const result: Partial<Record<F, string>> = {};
  const general: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    const text = Array.isArray(value) ? value.join(" ") : String(value);
    if ((fields as readonly string[]).includes(key)) result[key as F] = text;
    else general.push(key === "non_field_errors" || key === "detail" ? text : `${key}: ${text}`);
  }
  return { fields: result, general: general.length ? general.join(" ") : null };
}
