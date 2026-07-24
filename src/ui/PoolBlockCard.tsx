"use client";

import { useState } from "react";
import { deleteBlock } from "@/server/actions/planning";
import { BlockForm } from "@/ui/BlockForm";
import { SubmitButton } from "@/ui/SubmitButton";
import { useT } from "@/ui/i18n-context";

export interface PoolBlock {
  id: string;
  name: string;
  category: string;
  durationMin: number;
  expectedOutcome: string;
  firstAction: string;
  notes: string | null;
}

export function PoolBlockCard({ block }: { block: PoolBlock }) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (editing) {
    return (
      <li>
        <BlockForm
          mode="edit"
          blockId={block.id}
          defaults={{
            name: block.name,
            category: block.category,
            durationMin: block.durationMin,
            expectedOutcome: block.expectedOutcome,
            firstAction: block.firstAction,
            notes: block.notes,
          }}
          onDone={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3">
      <div className="flex flex-col">
        <span dir="auto" className="font-medium">
          {block.name}
        </span>
        <span className="text-sm opacity-60">
          {block.durationMin} {t.planning.minutesShort}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm underline underline-offset-4 opacity-70"
        >
          {t.planning.edit}
        </button>
        {confirming ? (
          <form action={deleteBlock}>
            <input type="hidden" name="id" value={block.id} />
            <SubmitButton className="text-sm font-medium underline underline-offset-4">
              {t.planning.deleteConfirm}
            </SubmitButton>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-sm underline underline-offset-4 opacity-70"
          >
            {t.planning.delete}
          </button>
        )}
      </div>
    </li>
  );
}
