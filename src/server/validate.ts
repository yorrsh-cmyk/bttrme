import { isBlockCategory, type BlockCategory } from "@/domain/blockTypes";

// Small hand-rolled validators at the server boundary (no schema-validation
// dependency — proportional for one user). Each returns a value or an error
// key; the UI maps error keys to catalog copy in the active language.

export const LIMITS = {
  name: 80,
  outcome: 200,
  firstAction: 200,
  notes: 1000,
  goal: 120,
  durationMinMax: 1440, // a block cannot be longer than a day
} as const;

export type FieldError =
  | "required"
  | "too_long"
  | "bad_category"
  | "bad_duration"
  | "bad_position";

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Required, trimmed, length-capped text. */
export function requiredText(
  value: FormDataEntryValue | null,
  max: number,
): { ok: true; value: string } | { ok: false; error: FieldError } {
  const v = text(value);
  if (v.length === 0) return { ok: false, error: "required" };
  if (v.length > max) return { ok: false, error: "too_long" };
  return { ok: true, value: v };
}

/** Optional text (empty → null), length-capped. */
export function optionalText(
  value: FormDataEntryValue | null,
  max: number,
): { ok: true; value: string | null } | { ok: false; error: FieldError } {
  const v = text(value);
  if (v.length === 0) return { ok: true, value: null };
  if (v.length > max) return { ok: false, error: "too_long" };
  return { ok: true, value: v };
}

export function category(
  value: FormDataEntryValue | null,
): { ok: true; value: BlockCategory } | { ok: false; error: FieldError } {
  const v = text(value);
  return isBlockCategory(v) ? { ok: true, value: v } : { ok: false, error: "bad_category" };
}

export function durationMinutes(
  value: FormDataEntryValue | null,
): { ok: true; value: number } | { ok: false; error: FieldError } {
  const n = Number(text(value));
  if (!Number.isInteger(n) || n < 1 || n > LIMITS.durationMinMax) {
    return { ok: false, error: "bad_duration" };
  }
  return { ok: true, value: n };
}

export function goalPosition(
  value: FormDataEntryValue | null,
): { ok: true; value: number } | { ok: false; error: FieldError } {
  const n = Number(text(value));
  return n >= 1 && n <= 3 && Number.isInteger(n)
    ? { ok: true, value: n }
    : { ok: false, error: "bad_position" };
}
