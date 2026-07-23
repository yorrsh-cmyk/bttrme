"use client";

import { useActionState } from "react";
import { saveGoals, type PlanningFormState } from "@/server/actions/planning";
import { FormError } from "@/ui/FormError";
import { useT } from "@/ui/i18n-context";

const initial: PlanningFormState = { error: null, ok: false };

// Exactly three slots, no "add more" (PRD 02 FR-4). Saved together.
export function GoalsEditor({
  weekId,
  goals,
}: {
  weekId: string;
  goals: Record<number, string>;
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState(saveGoals, initial);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{t.planning.goalsTitle}</h2>
        <p className="text-sm opacity-70">{t.planning.goalsIntro}</p>
      </div>
      <form action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="weekId" value={weekId} />
        {[1, 2, 3].map((position) => (
          <input
            key={position}
            name={`goal_${position}`}
            defaultValue={goals[position] ?? ""}
            placeholder={t.planning.goalPlaceholder}
            maxLength={120}
            dir="auto"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base"
          />
        ))}
        <FormError error={state.error} />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="self-start rounded-lg bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {t.planning.saveGoals}
          </button>
          {state.ok ? <span className="text-sm opacity-70">{t.planning.goalsSaved}</span> : null}
        </div>
      </form>
    </section>
  );
}
