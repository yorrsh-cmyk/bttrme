"use client";

import { useActionState, useEffect } from "react";
import {
  addOneOffBlock,
  updateBlock,
  type PlanningFormState,
} from "@/server/actions/planning";
import { BlockFields, type BlockFieldDefaults } from "@/ui/BlockFields";
import { FormError } from "@/ui/FormError";
import { useT } from "@/ui/i18n-context";

const initial: PlanningFormState = { error: null, ok: false };

// One-off pool block (create) or editing an existing pool block. Same fields
// as a template, but written straight onto the block.
export function BlockForm({
  mode,
  weekId,
  blockId,
  defaults,
  onDone,
}: {
  mode: "create" | "edit";
  weekId?: string;
  blockId?: string;
  defaults?: BlockFieldDefaults;
  onDone?: () => void;
}) {
  const t = useT();
  const action = mode === "create" ? addOneOffBlock : updateBlock;
  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (state.ok) onDone?.();
  }, [state.ok, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4">
      {mode === "create" && weekId ? <input type="hidden" name="weekId" value={weekId} /> : null}
      {mode === "edit" && blockId ? <input type="hidden" name="id" value={blockId} /> : null}
      <BlockFields durationName="durationMin" defaults={defaults} />
      <FormError error={state.error} />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {t.common.save}
        </button>
        {onDone ? (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
          >
            {t.common.cancel}
          </button>
        ) : null}
      </div>
    </form>
  );
}
