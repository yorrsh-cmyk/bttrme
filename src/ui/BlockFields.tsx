"use client";

import { BLOCK_CATEGORIES } from "@/domain/blockTypes";
import { useT } from "@/ui/i18n-context";

// The five required fields + optional notes, shared by the template form and
// the one-off/edit block forms (same shape — PRD 02 FR-1 / FR-5). The duration
// input's `name` differs (template vs block), so it's a prop.

export interface BlockFieldDefaults {
  name?: string;
  category?: string;
  durationMin?: number;
  expectedOutcome?: string;
  firstAction?: string;
  notes?: string | null;
}

const inputClass = "rounded-lg border border-gray-300 bg-white px-3 py-2 text-base";

export function BlockFields({
  durationName,
  defaults = {},
}: {
  durationName: "defaultDurationMin" | "durationMin";
  defaults?: BlockFieldDefaults;
}) {
  const t = useT();
  const f = t.library.field;

  return (
    <>
      <label className="flex flex-col gap-1">
        <span className="text-sm opacity-70">{f.name}</span>
        <input
          name="name"
          required
          defaultValue={defaults.name ?? ""}
          dir="auto"
          className={inputClass}
        />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm opacity-70">{f.category}</span>
          <select
            name="category"
            defaultValue={defaults.category ?? "work"}
            className={inputClass}
          >
            {BLOCK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t.categories[c]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex w-32 flex-col gap-1">
          <span className="text-sm opacity-70">{f.duration}</span>
          <span className="flex items-center gap-2">
            <input
              name={durationName}
              type="number"
              inputMode="numeric"
              min={1}
              max={1440}
              required
              defaultValue={defaults.durationMin ?? 60}
              className={`${inputClass} w-20`}
            />
            <span className="text-sm opacity-60">{f.minutes}</span>
          </span>
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm opacity-70">{f.expectedOutcome}</span>
        <input
          name="expectedOutcome"
          required
          defaultValue={defaults.expectedOutcome ?? ""}
          dir="auto"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm opacity-70">{f.firstAction}</span>
        <input
          name="firstAction"
          required
          defaultValue={defaults.firstAction ?? ""}
          dir="auto"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm opacity-70">
          {f.notes} <span className="opacity-50">({f.optional})</span>
        </span>
        <textarea
          name="notes"
          rows={2}
          defaultValue={defaults.notes ?? ""}
          dir="auto"
          className={inputClass}
        />
      </label>
    </>
  );
}
