"use client";

import { useT } from "@/ui/i18n-context";
import type { FieldError } from "@/server/validate";

// Neutral, never red (Phase 1 §3). Maps a validation error key to catalog copy.
export function FormError({ error }: { error: FieldError | null }) {
  const t = useT();
  if (!error) return null;
  const message = t.errors[error] ?? t.errors.generic;
  return (
    <p role="status" className="text-sm opacity-80">
      {message}
    </p>
  );
}
