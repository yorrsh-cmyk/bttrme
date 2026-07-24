"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { PartOfDay } from "@/domain/blockTypes";
import {
  completeBlock,
  deferBlock,
  moveBlock,
  skipBlock,
  skipPassedToday,
  startBlock,
  stopEarlyBlock,
  undoSkipBlock,
} from "@/server/actions/execution";
import { useT } from "@/ui/i18n-context";

// The execution moment (PRD 03 §5–6). One stable client boundary so the Skip
// undo survives the server re-render that removes the block from the
// foreground. Nothing here judges, counts, or reddens: a miss is one tap and it
// is reversible; overrun is shown plainly; "stopped early" is a completion.

export interface ExecBlock {
  id: string;
  name: string;
  categoryLabel: string;
  partOfDay: PartOfDay;
  partLabel: string;
  startTime: string | null;
  durationMin: number;
  expectedOutcome: string;
  firstAction: string;
  whyToday: string | null; // the linked goal's text, else the category label
  nextPart: PartOfDay | null; // the next part today, for "Later today"
  moveTargets: { date: string; label: string }[]; // upcoming in-week days
}

export interface ActiveExecBlock extends ExecBlock {
  actualStartAtISO: string;
  stale: boolean;
}

interface Props {
  active: ActiveExecBlock | null;
  current: ExecBlock | null;
  upcoming: ExecBlock[];
  passed: ExecBlock[];
}

export function ExecutionView({ active, current, upcoming, passed }: Props) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  // The just-skipped block, kept in local state so its Undo survives the
  // server revalidation that pulls the block out of the foreground.
  const [justSkipped, setJustSkipped] = useState<{ id: string; name: string } | null>(null);

  // Let the undo linger a while, then settle quietly (no nagging list of skips).
  useEffect(() => {
    if (!justSkipped) return;
    const timer = setTimeout(() => setJustSkipped(null), 8000);
    return () => clearTimeout(timer);
  }, [justSkipped]);

  const run = (fn: () => void) => startTransition(fn);

  function onSkip(block: { id: string; name: string }) {
    setJustSkipped(block);
    run(() => void skipBlock(block.id));
  }

  function onUndo() {
    if (!justSkipped) return;
    const id = justSkipped.id;
    setJustSkipped(null);
    run(() => void undoSkipBlock(id));
  }

  return (
    <div className={`flex flex-col gap-6 ${pending ? "opacity-90" : ""}`}>
      {justSkipped && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-100 px-4 py-3">
          <span dir="auto" className="text-sm opacity-70">
            {t.execution.skip} · <span dir="auto">{justSkipped.name}</span>
          </span>
          <button
            type="button"
            onClick={onUndo}
            className="text-sm font-medium underline underline-offset-4"
          >
            {t.common.undo}
          </button>
        </div>
      )}

      {passed.length > 0 && (
        <PassedWindow passed={passed} onSkip={onSkip} run={run} />
      )}

      {active ? (
        <>
          <ActiveCard block={active} run={run} />
          {/* While a block runs, others stay a quiet list (one active at a time). */}
          {upcoming.length > 0 && <UpcomingList blocks={upcoming} />}
        </>
      ) : current ? (
        <>
          <CurrentCard block={current} onSkip={onSkip} run={run} />
          {upcoming.map((b) => (
            <UpcomingCard key={b.id} block={b} onSkip={onSkip} run={run} />
          ))}
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

// --- The foregrounded, not-yet-started block: full context + four responses ---

function CurrentCard({
  block,
  onSkip,
  run,
}: {
  block: ExecBlock;
  onSkip: (b: { id: string; name: string }) => void;
  run: (fn: () => void) => void;
}) {
  const t = useT();
  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-gray-200 p-5">
      <BlockContext block={block} />

      {/* First step — visually primary (FR-8) */}
      <div className="rounded-xl bg-gray-50 p-4">
        <div className="text-xs uppercase tracking-wide opacity-50">{t.execution.firstStep}</div>
        <p dir="auto" className="mt-1 text-lg font-semibold leading-snug">
          {block.firstAction}
        </p>
      </div>

      <FourResponses block={block} onSkip={onSkip} run={run} />
    </article>
  );
}

// The four responses (Start / Later today / Another day / Skip), each ≤ 2 taps.
// Shared by the foregrounded current block and any block picked out of order.
function FourResponses({
  block,
  onSkip,
  run,
}: {
  block: ExecBlock;
  onSkip: (b: { id: string; name: string }) => void;
  run: (fn: () => void) => void;
}) {
  const t = useT();
  const [moving, setMoving] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => run(() => void startBlock(block.id))}
        className="min-h-12 rounded-xl bg-gray-900 px-4 py-3 text-center font-semibold text-white"
      >
        {t.execution.start}
      </button>
      <div className="flex gap-2">
        {block.nextPart && (
          <button
            type="button"
            onClick={() => run(() => void deferBlock(block.id, block.nextPart as string))}
            className="min-h-12 flex-1 rounded-xl border border-gray-300 px-3 py-3 text-center"
          >
            {t.execution.defer}
          </button>
        )}
        {block.moveTargets.length > 0 && (
          <button
            type="button"
            onClick={() => setMoving((v) => !v)}
            aria-expanded={moving}
            className="min-h-12 flex-1 rounded-xl border border-gray-300 px-3 py-3 text-center"
          >
            {t.execution.move}
          </button>
        )}
        <button
          type="button"
          onClick={() => onSkip({ id: block.id, name: block.name })}
          className="min-h-12 flex-1 rounded-xl border border-gray-300 px-3 py-3 text-center"
        >
          {t.execution.skip}
        </button>
      </div>

      {moving && (
        <ul className="flex flex-col gap-1 rounded-xl border border-gray-200 p-2">
          {block.moveTargets.map((target) => (
            <li key={target.date}>
              <button
                type="button"
                onClick={() =>
                  run(() =>
                    void moveBlock(block.id, target.date, block.partOfDay, "deferred_in_moment"),
                  )
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

// Any block that isn't foregrounded, still tappable so the day needn't run in
// strict order: tap to open its first step + the same four responses (starting
// it makes it the active block). Michael's own request — pick any task, act on it.
function UpcomingCard({
  block,
  onSkip,
  run,
}: {
  block: ExecBlock;
  onSkip: (b: { id: string; name: string }) => void;
  run: (fn: () => void) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center justify-between gap-3 text-start"
      >
        <span dir="auto" className="font-medium">
          {block.name}
        </span>
        <span className="text-sm opacity-50">{block.partLabel}</span>
      </button>
      {open && (
        <>
          <div className="rounded-xl bg-gray-50 p-3">
            <div className="text-xs uppercase tracking-wide opacity-50">
              {t.execution.firstStep}
            </div>
            <p dir="auto" className="mt-1 text-base font-medium leading-snug">
              {block.firstAction}
            </p>
          </div>
          <FourResponses block={block} onSkip={onSkip} run={run} />
        </>
      )}
    </article>
  );
}

// --- The active (started) block: neutral elapsed vs planned + close-out -------

function ActiveCard({ block, run }: { block: ActiveExecBlock; run: (fn: () => void) => void }) {
  const t = useT();
  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-gray-300 p-5">
      <BlockContext block={block} />

      <div className="rounded-xl bg-gray-50 p-4">
        <div className="text-xs uppercase tracking-wide opacity-50">{t.execution.firstStep}</div>
        <p dir="auto" className="mt-1 text-base font-medium leading-snug">
          {block.firstAction}
        </p>
      </div>

      <Elapsed startAtISO={block.actualStartAtISO} durationMin={block.durationMin} />

      {block.stale && (
        <p className="text-center text-sm opacity-70">{t.execution.stillGoing}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => run(() => void completeBlock(block.id))}
          className="min-h-12 flex-1 rounded-xl bg-gray-900 px-4 py-3 text-center font-semibold text-white"
        >
          {t.execution.done}
        </button>
        <button
          type="button"
          onClick={() => run(() => void stopEarlyBlock(block.id))}
          className="min-h-12 flex-1 rounded-xl border border-gray-300 px-3 py-3 text-center"
        >
          {t.execution.stoppedEarly}
        </button>
      </div>
    </article>
  );
}

// A minute-ticking, neutral elapsed/planned read-out. No red at overrun (FR-10).
function Elapsed({ startAtISO, durationMin }: { startAtISO: string; durationMin: number }) {
  const t = useT();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - new Date(startAtISO).getTime()) / 60_000));
  return (
    <div className="flex items-baseline justify-center gap-2 text-sm opacity-70">
      <span>
        {t.execution.elapsed} {elapsed}
      </span>
      <span aria-hidden>·</span>
      <span>
        {t.execution.planned} {durationMin} {t.execution.minutesShort}
      </span>
    </div>
  );
}

// Shared context header: name, part (+ time), duration, done-when, why-today.
function BlockContext({ block }: { block: ExecBlock }) {
  const t = useT();
  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm opacity-60">
        <span>{block.partLabel}</span>
        {block.startTime && <span>· {block.startTime}</span>}
        <span>
          · {block.durationMin} {t.execution.minutesShort}
        </span>
      </div>
      <h1 dir="auto" className="text-2xl font-semibold leading-tight">
        {block.name}
      </h1>
      {block.whyToday && (
        <p dir="auto" className="text-sm opacity-70">
          <span className="opacity-60">{t.execution.whyToday}: </span>
          {block.whyToday}
        </p>
      )}
      <p dir="auto" className="text-sm">
        <span className="opacity-60">{t.execution.doneWhen}: </span>
        {block.expectedOutcome}
      </p>
    </header>
  );
}

// --- Passed-window recovery (FR-11): earlier parts, per-block + skip-all ------

function PassedWindow({
  passed,
  onSkip,
  run,
}: {
  passed: ExecBlock[];
  onSkip: (b: { id: string; name: string }) => void;
  run: (fn: () => void) => void;
}) {
  const t = useT();
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-gray-50 p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{t.recovery.passedTitle}</h2>
        <p className="text-sm opacity-70">{t.recovery.passedIntro}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {passed.map((block) => (
          <li
            key={block.id}
            className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3"
          >
            <span dir="auto" className="font-medium">
              {block.name}
            </span>
            <div className="flex flex-wrap gap-2 text-sm">
              {block.nextPart && (
                <button
                  type="button"
                  onClick={() => run(() => void deferBlock(block.id, block.nextPart as string))}
                  className="min-h-11 rounded-lg border border-gray-300 px-3 py-2"
                >
                  {t.execution.defer}
                </button>
              )}
              {block.moveTargets[0] && (
                <button
                  type="button"
                  onClick={() =>
                    run(() =>
                      void moveBlock(
                        block.id,
                        block.moveTargets[0]!.date,
                        block.partOfDay,
                        "deferred_in_moment",
                      ),
                    )
                  }
                  className="min-h-11 rounded-lg border border-gray-300 px-3 py-2"
                >
                  {t.execution.move}
                </button>
              )}
              <button
                type="button"
                onClick={() => onSkip({ id: block.id, name: block.name })}
                className="min-h-11 rounded-lg border border-gray-300 px-3 py-2"
              >
                {t.execution.skip}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => run(() => void skipPassedToday())}
        className="min-h-11 self-start text-sm underline underline-offset-4 opacity-70"
      >
        {t.recovery.skipAll}
      </button>
    </section>
  );
}

function UpcomingList({ blocks }: { blocks: ExecBlock[] }) {
  return (
    <ul className="flex flex-col gap-2 opacity-80">
      {blocks.map((block) => (
        <li
          key={block.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-3"
        >
          <span dir="auto" className="font-medium">
            {block.name}
          </span>
          <span className="text-sm opacity-50">{block.partLabel}</span>
        </li>
      ))}
    </ul>
  );
}

function EmptyState() {
  const t = useT();
  return (
    <div className="flex flex-col items-start gap-3 py-6">
      <p className="opacity-70">{t.execution.nothingMore}</p>
      <Link href="/day" className="text-sm font-medium underline underline-offset-4">
        {t.execution.planToday}
      </Link>
    </div>
  );
}
