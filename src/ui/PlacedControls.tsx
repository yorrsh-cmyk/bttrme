"use client";

import { useState, useTransition } from "react";
import type { PartOfDay } from "@/domain/blockTypes";
import { moveBlock, returnBlockToPool, swapBlockOrder } from "@/server/actions/execution";
import { useT } from "@/ui/i18n-context";

// Controls on a block already placed on the day: reorder within its part,
// move to another day (a logged block_moved, never a history edit), or send it
// back to the week pool. All are plan edits; none change the block's status.
export function PlacedControls({
  blockId,
  partOfDay,
  upId,
  downId,
  moveTargets,
}: {
  blockId: string;
  partOfDay: PartOfDay;
  upId: string | null;
  downId: string | null;
  moveTargets: { date: string; label: string }[];
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [moving, setMoving] = useState(false);
  const run = (fn: () => void) => startTransition(fn);

  return (
    <div className={`flex flex-col gap-2 ${pending ? "opacity-50" : ""}`}>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {upId && (
          <button
            type="button"
            aria-label="up"
            onClick={() => run(() => void swapBlockOrder(blockId, upId))}
            className="min-h-11 min-w-11 rounded-lg border border-gray-300 px-3 py-1"
          >
            {t.scheduling.up}
          </button>
        )}
        {downId && (
          <button
            type="button"
            aria-label="down"
            onClick={() => run(() => void swapBlockOrder(blockId, downId))}
            className="min-h-11 min-w-11 rounded-lg border border-gray-300 px-3 py-1"
          >
            {t.scheduling.down}
          </button>
        )}
        {moveTargets.length > 0 && (
          <button
            type="button"
            onClick={() => setMoving((v) => !v)}
            aria-expanded={moving}
            className="min-h-11 underline underline-offset-4 opacity-70"
          >
            {t.scheduling.moveTitle}
          </button>
        )}
        <button
          type="button"
          onClick={() => run(() => void returnBlockToPool(blockId))}
          className="min-h-11 underline underline-offset-4 opacity-70"
        >
          {t.scheduling.backToPool}
        </button>
      </div>

      {moving && (
        <ul className="flex flex-col gap-1 rounded-xl border border-gray-200 p-2">
          {moveTargets.map((target) => (
            <li key={target.date}>
              <button
                type="button"
                onClick={() =>
                  run(() => void moveBlock(blockId, target.date, partOfDay, "planned_move"))
                }
                className="min-h-11 w-full rounded-lg px-3 py-2 text-start hover:bg-gray-50"
              >
                {target.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
