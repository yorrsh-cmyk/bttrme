"use client";

import { useState } from "react";
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

const DURATION_PRESETS = [10, 15, 30, 45, 60] as const;

// Preset dropdown (10/15/30/45/60) plus a "custom" option that reveals a manual
// minutes input. Only the active control carries the field `name`, so exactly
// one value is submitted.
function DurationField({
  name,
  initial,
}: {
  name: "defaultDurationMin" | "durationMin";
  initial: number;
}) {
  const t = useT();
  const f = t.library.field;
  const startsPreset = (DURATION_PRESETS as readonly number[]).includes(initial);
  const [mode, setMode] = useState<string>(startsPreset ? String(initial) : "custom");
  const isCustom = mode === "custom";

  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm opacity-70">{f.duration}</span>
      <div className="flex items-center gap-2">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          name={isCustom ? undefined : name}
          className={inputClass}
        >
          {DURATION_PRESETS.map((p) => (
            <option key={p} value={p}>
              {p} {f.minutes}
            </option>
          ))}
          <option value="custom">{f.custom}</option>
        </select>
        {isCustom ? (
          <span className="flex items-center gap-2">
            <input
              name={name}
              type="number"
              inputMode="numeric"
              min={1}
              max={1440}
              required
              autoFocus
              defaultValue={startsPreset ? "" : initial}
              className={`${inputClass} w-24`}
            />
            <span className="text-sm opacity-60">{f.minutes}</span>
          </span>
        ) : null}
      </div>
    </label>
  );
}

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

      <label className="flex flex-col gap-1">
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

      <DurationField name={durationName} initial={defaults.durationMin ?? 60} />

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
