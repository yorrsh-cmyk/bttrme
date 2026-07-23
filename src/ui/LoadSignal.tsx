import type { LoadSummary } from "@/domain/load";
import type { Catalog } from "@/i18n/catalog";

// The load signal: planned non-rest hours against a soft reference line
// (PRD 02 FR-7). Never blocking, never red, no score — just a fact about the
// week, plus a neutral note when it's heavy. Server-renderable (no state).
export function LoadSignal({
  summary,
  copy,
}: {
  summary: LoadSummary;
  copy: Catalog["load"];
}) {
  const { plannedHours, thresholdHours, level } = summary;
  // A calm proportion bar; the marker is the reference line, not a target.
  const fill = thresholdHours > 0 ? Math.min(1, plannedHours / thresholdHours) : 0;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 px-4 py-3">
      <div className="flex items-baseline justify-between">
        <span className="text-base">
          <span className="font-semibold" dir="auto">
            {plannedHours}
          </span>{" "}
          {copy.hoursUnit} {copy.planned}
        </span>
        {level === "heavy" ? (
          <span className="text-sm font-medium opacity-80">{copy.heavy}</span>
        ) : null}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full ${level === "heavy" ? "bg-gray-700" : "bg-gray-400"}`}
          style={{ inlineSize: `${Math.round(fill * 100)}%` }}
        />
      </div>
      <span className="text-xs opacity-50">
        {copy.referenceLabel}: {thresholdHours} {copy.hoursUnit}
      </span>
    </div>
  );
}
