"use client";

import { useTransition } from "react";
import { archiveMissedDays } from "@/server/actions/execution";
import { useT } from "@/ui/i18n-context";

// The return-after-days-away screen (FR-12). One calm sentence, one tap, and
// the app lands on a clean today. No count of what was missed, no red, no
// backfilling ever requested — a bad stretch is not a ruined week.
export function AbsenceArchive() {
  const t = useT();
  const [pending, startTransition] = useTransition();
  return (
    <section className="flex flex-col items-start gap-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t.recovery.absenceTitle}</h1>
        <p className="opacity-70">{t.recovery.absenceIntro}</p>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => void archiveMissedDays())}
        className={`min-h-12 rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white ${
          pending ? "pointer-events-none opacity-50" : ""
        }`}
      >
        {t.recovery.archive}
      </button>
    </section>
  );
}
