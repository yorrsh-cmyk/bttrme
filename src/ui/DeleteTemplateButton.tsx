"use client";

import { useState } from "react";
import { deleteTemplate } from "@/server/actions/templates";
import { SubmitButton } from "@/ui/SubmitButton";
import { useT } from "@/ui/i18n-context";

// Delete is only offered for unused templates (no history to protect). A small
// inline two-step confirm — not a modal — guards against a misclick erasing a
// five-field definition. Neutral styling, never red (Phase 1 §3).
export function DeleteTemplateButton({ templateId }: { templateId: string }) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm underline underline-offset-4 opacity-70"
      >
        {t.library.delete}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-3">
      <span className="text-sm opacity-70">{t.library.deleteConfirm}</span>
      <form action={deleteTemplate}>
        <input type="hidden" name="id" value={templateId} />
        <SubmitButton className="text-sm font-medium underline underline-offset-4">
          {t.library.delete}
        </SubmitButton>
      </form>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-sm underline underline-offset-4 opacity-70"
      >
        {t.common.cancel}
      </button>
    </span>
  );
}
