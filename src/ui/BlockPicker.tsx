"use client";

import Link from "next/link";
import { useState } from "react";
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
// one-off form. Adding a template is a plain form submit per row.
export function BlockPicker({
  weekId,
  templates,
}: {
  weekId: string;
  templates: PickerTemplate[];
}) {
  const t = useT();
  const [mode, setMode] = useState<"closed" | "library" | "oneoff">("closed");

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
          {templates.map((tpl) => (
            <li key={tpl.id}>
              <form action={addBlockFromTemplate}>
                <input type="hidden" name="weekId" value={weekId} />
                <input type="hidden" name="templateId" value={tpl.id} />
                <button
                  type="submit"
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-start hover:bg-gray-50"
                >
                  <span dir="auto">{tpl.name}</span>
                  <span className="text-sm opacity-60">
                    {t.categories[tpl.category as keyof typeof t.categories]} ·{" "}
                    {tpl.defaultDurationMin} {t.planning.minutesShort}
                  </span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
