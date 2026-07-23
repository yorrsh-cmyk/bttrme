"use client";

import { useActionState, useEffect, useState } from "react";
import { createTemplate, updateTemplate, type TemplateFormState } from "@/server/actions/templates";
import { BlockFields, type BlockFieldDefaults } from "@/ui/BlockFields";
import { FormError } from "@/ui/FormError";
import { useT } from "@/ui/i18n-context";

const initial: TemplateFormState = { error: null, ok: false };

// One component for both "new action type" and "edit" — a disclosure that
// closes itself on a successful save.
export function TemplateForm({
  mode,
  templateId,
  defaults,
}: {
  mode: "create" | "edit";
  templateId?: string;
  defaults?: BlockFieldDefaults;
}) {
  const t = useT();
  const action = mode === "create" ? createTemplate : updateTemplate;
  const [state, formAction, pending] = useActionState(action, initial);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          mode === "create"
            ? "rounded-lg bg-gray-900 px-4 py-2 font-medium text-white"
            : "text-sm underline underline-offset-4 opacity-70"
        }
      >
        {mode === "create" ? t.library.addTemplate : t.library.edit}
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4">
      {mode === "edit" && templateId ? (
        <input type="hidden" name="id" value={templateId} />
      ) : null}
      <BlockFields durationName="defaultDurationMin" defaults={defaults} />
      <FormError error={state.error} />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {t.common.save}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
        >
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}
