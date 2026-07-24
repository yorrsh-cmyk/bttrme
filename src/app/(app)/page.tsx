import Link from "next/link";
import { redirect } from "next/navigation";
import {
  composeDay,
  isStaleActive,
  partOfDayIndex,
} from "@/domain/blockMachine";
import { PARTS_OF_DAY, type PartOfDay } from "@/domain/blockTypes";
import {
  addDays,
  todayInTimeZone,
  weekEnd,
  weekStartForInstant,
  type WeekStartDay,
} from "@/domain/weekCycle";
import { localeFor, t } from "@/i18n/catalog";
import { autoCloseElapsedDays, distinctPastDays } from "@/server/autoClose";
import { blockToSnapshot } from "@/server/blockOps";
import {
  getOrCreateWeek,
  listDayBlocks,
  listGoals,
  listPastScheduledBlocks,
} from "@/server/queries";
import { getSessionUser } from "@/server/session";
import { AbsenceArchive } from "@/ui/AbsenceArchive";
import {
  ExecutionView,
  type ActiveExecBlock,
  type ExecBlock,
} from "@/ui/ExecutionView";

type Block = Awaited<ReturnType<typeof listDayBlocks>>[number];

function formatToday(date: string, language: "he" | "en"): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Intl.DateTimeFormat(localeFor(language), {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export default async function TodayPage() {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  const copy = t(me.language);
  const now = new Date();
  const tz = me.timezone;
  const weekStartDay = me.weekStartDay as WeekStartDay;
  const today = todayInTimeZone(now, tz);

  // Recovery gate: a real multi-day absence (leftover scheduled blocks spanning
  // ≥ 2 past days) gets the calm "start fresh" screen, not a silent bulk close.
  const past = await listPastScheduledBlocks(today);
  if (distinctPastDays(past) >= 2) {
    return (
      <section className="flex flex-col gap-2">
        <AbsenceArchive />
      </section>
    );
  }
  // A single elapsed day auto-closes silently on open (the normal boundary).
  if (past.length > 0) {
    await autoCloseElapsedDays(now, tz);
  }

  // Today's week + goals (for the "why this day" line).
  const weekStart = weekStartForInstant(now, tz, weekStartDay);
  const wk = await getOrCreateWeek(weekStart);
  const goals = await listGoals(wk.id);
  const goalText = (id: string | null): string | null =>
    id ? (goals.find((g) => g.id === id)?.text ?? null) : null;

  const dayBlocks = await listDayBlocks(today);
  const view = composeDay(dayBlocks, now, tz);

  // Move targets: the remaining days of this block's week (a block stays inside
  // its week). Same set for every block on today.
  const moveTargets: { date: string; label: string }[] = [];
  const lastDay = weekEnd(weekStart);
  for (let d = addDays(today, 1); d <= lastDay; d = addDays(d, 1)) {
    moveTargets.push({ date: d, label: formatToday(d, me.language) });
  }

  const nextPartOf = (part: PartOfDay): PartOfDay | null =>
    PARTS_OF_DAY[partOfDayIndex(part) + 1] ?? null;

  const toExec = (b: Block): ExecBlock => ({
    id: b.id,
    name: b.name,
    categoryLabel: copy.categories[b.category],
    partOfDay: (b.partOfDay ?? "morning") as PartOfDay,
    partLabel: copy.parts[(b.partOfDay ?? "morning") as PartOfDay],
    startTime: b.startTime,
    durationMin: b.durationMin,
    expectedOutcome: b.expectedOutcome,
    firstAction: b.firstAction,
    whyToday: goalText(b.goalId) ?? copy.categories[b.category],
    nextPart: b.partOfDay ? nextPartOf(b.partOfDay) : null,
    moveTargets,
  });

  const active: ActiveExecBlock | null = view.active
    ? {
        ...toExec(view.active),
        actualStartAtISO: (view.active.actualStartAt ?? now).toISOString(),
        stale: isStaleActive(blockToSnapshot(view.active), now),
      }
    : null;

  const current: ExecBlock | null = view.current ? toExec(view.current) : null;
  const upcoming: ExecBlock[] = view.upcoming.map(toExec);
  const passed: ExecBlock[] = view.passed.map(toExec);

  return (
    <section className="flex flex-col gap-5">
      <header className="flex items-baseline justify-between gap-3">
        <h1 dir="auto" className="text-sm font-medium opacity-60">
          {formatToday(today, me.language)}
        </h1>
        <Link
          href={`/day/${today}`}
          className="text-sm underline underline-offset-4 opacity-70"
        >
          {copy.execution.planToday}
        </Link>
      </header>

      <ExecutionView active={active} current={current} upcoming={upcoming} passed={passed} />
    </section>
  );
}
