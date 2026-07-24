"use client";

import { useState, useTransition } from "react";
import { PARTS_OF_DAY, type PartOfDay } from "@/domain/blockTypes";
import { scheduleBlock } from "@/server/actions/execution";
import { useT } from "@/ui/i18n-context";

// A pool block waiting to be placed onto the day. The fast path is one tap on a
// part of day (morning / afternoon / evening) — planning a day should take under
// three minutes (PRD 03 §8). Time and the optional "why this day" goal link live
// behind a quiet toggle so they never slow the common case.
export function PoolPlacer({
  blockId,
  date,
  name,
  durationLabel,
  goals,
}: {
  blockId: string;
  date: string;
  name: string;
  durationLabel: string;
  goals: { id: string; text: string }[];
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [more, setMore] = useState(false);
  const [time, setTime] = useState("");
  const [goalId, setGoalId] = useState("");

  function place(part: PartOfDay) {
    startTransition(() =>
      void scheduleBlock(blockId, date, part, time || null, goalId || null),
    );
  }

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-gray-200 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span dir="auto" className="font-medium">
          {name}
        </span>
        <span className="text-sm opacity-50">{durationLabel}</span>
      </div>

      <div className={`flex gap-2 ${pending ? "pointer-events-none opacity-50" : ""}`}>
        {PARTS_OF_DAY.map((part) => (
          <button
            key={part}
            type="button"
            onClick={() => place(part)}
            className="min-h-11 flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm"
          >
            {t.parts[part]}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setMore((v) => !v)}
        aria-expanded={more}
        className="self-start text-xs underline underline-offset-4 opacity-60"
      >
        {t.scheduling.time} · {t.scheduling.whyThisDay}
      </button>

      {more && (
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <span className="opacity-60">{t.scheduling.time}</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1"
            />
          </label>
          {goals.length > 0 && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="opacity-60">{t.scheduling.whyThisDay}</span>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-2"
              >
                <option value="">{t.scheduling.noGoalLink}</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.text}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
    </li>
  );
}
