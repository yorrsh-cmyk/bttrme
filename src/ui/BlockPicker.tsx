"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addBlockFromTemplate } from "@/server/actions/planning";
import { BlockForm } from "@/ui/BlockForm";
import { useT } from "@/ui/i18n-context";

export interface PickerTemplate {
  id: string;
  name: string;
  category: string;
  defaultDurationMin: number;
}

// Add a block: tap a library template (≤3 interactions, PRD 02 NFR) or open the
// one-off form. Each tap shows an immediate count on that row (optimistic), so
// under Neon latency you always know the tap registered — no re-tapping out of
// uncertainty, no accidental duplicates. Adding the same template several times
// on purpose is still supported (FR-8); the count just makes it legible.
export function BlockPicker({
  weekId,
  templates,
}: {
  weekId: string;
  templates: PickerTemplate[];
}) {
  const t = useT();
  const [mode, setMode] = useState<"closed" | "library" | "oneoff">("closed");
  const [added, setAdded] = useState<Record<string, number>>({});
  const [, startTransition] = useTransition();

  function add(templateId: string) {
    setAdded((a) => ({ ...a, [templateId]: (a[templateId] ?? 0) + 1 }));
    startTransition(async () => {
      await addBlockFromTemplate(weekId, templateId);
    });
  }

  if (mode === "closed") {
    return (
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setMode("library")}
          className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white"
        >
          {t.planning.addFromLibrary}
        </button>
        <button
          type="button"
          onClick={() => setMode("oneoff")}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
        >
          {t.planning.addOneOff}
        </button>
      </div>
    );
  }

  if (mode === "oneoff") {
    return <BlockForm mode="create" weekId={weekId} onDone={() => setMode("closed")} />;
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{t.planning.pickerTitle}</h3>
        <button
          type="button"
          onClick={() => setMode("closed")}
          className="text-sm underline underline-offset-4 opacity-70"
        >
          {t.common.cancel}
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-start gap-2">
          <p className="opacity-70">{t.planning.pickerEmpty}</p>
          <Link href="/library" className="text-sm underline underline-offset-4">
            {t.planning.goToLibrary}
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {templates.map((tpl) => {
            const count = added[tpl.id] ?? 0;
            return (
              <li key={tpl.id}>
                <button
                  type="button"
                  onClick={() => add(tpl.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 text-start active:bg-gray-100 hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2">
                    {count > 0 ? (
                      <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-gray-900 px-1.5 text-sm font-medium text-white">
                        {count}
                      </span>
                    ) : null}
                    <span dir="auto">{tpl.name}</span>
                  </span>
                  <span className="text-sm opacity-60">
                    {t.categories[tpl.category as keyof typeof t.categories]} ·{" "}
                    {tpl.defaultDurationMin} {t.planning.minutesShort}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
