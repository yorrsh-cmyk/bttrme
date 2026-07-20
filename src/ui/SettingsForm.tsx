"use client";

import { useActionState } from "react";
import { updateSettings, type SettingsFormState } from "@/server/actions/settings";
import type { Language } from "@/i18n/catalog";

interface SettingsFormProps {
  initial: {
    language: Language;
    timezone: string;
    weekStartDay: "sun" | "mon";
  };
  timezones: string[];
  copy: {
    language: string;
    timezone: string;
    weekStart: string;
    weekStartSun: string;
    weekStartMon: string;
    save: string;
    saved: string;
    languageNames: Record<Language, string>;
  };
}

const initialState: SettingsFormState = { saved: false };

export function SettingsForm({ initial, timezones, copy }: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(updateSettings, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm opacity-70">{copy.language}</span>
        <select
          name="language"
          defaultValue={initial.language}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2"
        >
          <option value="he">{copy.languageNames.he}</option>
          <option value="en">{copy.languageNames.en}</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm opacity-70">{copy.timezone}</span>
        <select
          name="timezone"
          defaultValue={initial.timezone}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2"
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm opacity-70">{copy.weekStart}</span>
        <select
          name="weekStartDay"
          defaultValue={initial.weekStartDay}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2"
        >
          <option value="sun">{copy.weekStartSun}</option>
          <option value="mon">{copy.weekStartMon}</option>
        </select>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {copy.save}
        </button>
        {state.saved ? (
          <span role="status" className="text-sm opacity-70">
            {copy.saved}
          </span>
        ) : null}
      </div>
    </form>
  );
}
