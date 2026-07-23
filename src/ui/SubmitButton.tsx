"use client";

import { useFormStatus } from "react-dom";

// Disables itself for the whole duration of the form's server action (including
// the revalidation round-trip), so a second "did that register?" tap during
// Neon latency can't fire the mutation twice. The dimmed state is also the
// confirmation that the first tap landed.
export function SubmitButton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className} ${pending ? "pointer-events-none opacity-50" : ""}`}
    >
      {children}
    </button>
  );
}
