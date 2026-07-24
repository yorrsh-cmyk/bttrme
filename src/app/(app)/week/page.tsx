import Link from "next/link";
import { redirect } from "next/navigation";
import { BLOCK_CATEGORIES, PARTS_OF_DAY, type PartOfDay } from "@/domain/blockTypes";
import { computeLoad } from "@/domain/load";
import {
  isWeekPlannable,
  nextWeekStart,
  weekEnd,
  weekStartForDate,
  weekStartForInstant,
  type WeekStartDay,
} from "@/domain/weekCycle";
import { localeFor, t } from "@/i18n/catalog";
import {
  getOrCreateWeek,
  listActiveTemplates,
  listGoals,
  listWeekBlocks,
} from "@/server/queries";
import { getSessionUser } from "@/server/session";
import { BlockPicker } from "@/ui/BlockPicker";
import { GoalsEditor } from "@/ui/GoalsEditor";
import { LoadSignal } from "@/ui/LoadSignal";
import { PoolBlockCard } from "@/ui/PoolBlockCard";

// Blocks that still count as this week's pending plan (not yet resolved). The
// load signal is computed from these — scheduling a block (pool → scheduled)
// keeps it in the count; only finishing/skipping a block resolves it out.
const PENDING_STATUSES = new Set(["pool", "scheduled", "active"]);

function formatRange(start: string, end: string, language: "he" | "en"): string {
  const toUTC = (d: string) => {
    const [y, m, day] = d.split("-").map(Number) as [number, number, number];
    return new Date(Date.UTC(y, m - 1, day));
  };
  const fmt = new Intl.DateTimeFormat(localeFor(language), {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  return fmt.formatRange(toUTC(start), toUTC(end));
}

function formatDayLabel(date: string, language: "he" | "en"): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Intl.DateTimeFormat(localeFor(language), {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  const copy = t(me.language);
  const now = new Date();
  const weekStartDay = me.weekStartDay as WeekStartDay;

  const currentStart = weekStartForInstant(now, me.timezone, weekStartDay);
  const params = await searchParams;

  // Resolve the requested week, snapping to a valid week-start and refusing
  // weeks that aren't plannable yet (redirect to the current week).
  let start = currentStart;
  if (params.start && /^\d{4}-\d{2}-\d{2}$/.test(params.start)) {
    const snapped = weekStartForDate(params.start, weekStartDay);
    if (isWeekPlannable(snapped, now, me.timezone, weekStartDay)) start = snapped;
    else redirect("/week");
  }

  const week = await getOrCreateWeek(start);
  const [goals, weekBlocks, templates] = await Promise.all([
    listGoals(week.id),
    listWeekBlocks(week.id),
    listActiveTemplates(),
  ]);

  const goalsByPosition: Record<number, string> = {};
  for (const g of goals) goalsByPosition[g.position] = g.text;

  // Pool = still to place; scheduled = already on a day (pending). The load
  // signal counts everything still pending, so scheduling never shrinks it —
  // only finishing or skipping a block resolves it out of the week's plan.
  const pool = weekBlocks.filter((b) => b.status === "pool");
  const scheduled = weekBlocks.filter((b) => b.status === "scheduled" || b.status === "active");
  const pendingBlocks = weekBlocks.filter((b) => PENDING_STATUSES.has(b.status));

  const load = computeLoad(
    pendingBlocks.map((b) => ({ category: b.category, durationMin: b.durationMin })),
    me.loadThresholdHours,
  );

  // Scheduled blocks grouped by day, then part of day, for the "on your days" view.
  const scheduledByDate = new Map<string, typeof scheduled>();
  for (const b of scheduled) {
    if (!b.scheduledDate) continue;
    const list = scheduledByDate.get(b.scheduledDate) ?? [];
    list.push(b);
    scheduledByDate.set(b.scheduledDate, list);
  }
  const scheduledDates = [...scheduledByDate.keys()].sort();
  const partIndex = (p: PartOfDay | null) => (p ? PARTS_OF_DAY.indexOf(p) : 99);

  const nextStart = nextWeekStart(currentStart);
  const nextPlannable = isWeekPlannable(nextStart, now, me.timezone, weekStartDay);
  const viewingNext = start === nextStart;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-3">
        <h1 className="text-xl font-semibold" dir="auto">
          {formatRange(start, weekEnd(start), me.language)}
        </h1>
        {viewingNext ? (
          <Link href="/week" className="text-sm underline underline-offset-4 opacity-70">
            {copy.planning.thisWeek}
          </Link>
        ) : nextPlannable ? (
          <Link
            href={`/week?start=${nextStart}`}
            className="text-sm underline underline-offset-4 opacity-70"
          >
            {copy.planning.planNextWeek}
          </Link>
        ) : null}
      </header>

      <GoalsEditor weekId={week.id} goals={goalsByPosition} />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{copy.planning.poolTitle}</h2>
        </div>

        <LoadSignal summary={load} copy={copy.load} />

        <BlockPicker
          weekId={week.id}
          templates={templates.map((tpl) => ({
            id: tpl.id,
            name: tpl.name,
            category: tpl.category,
            defaultDurationMin: tpl.defaultDurationMin,
          }))}
        />

        {pool.length === 0 && scheduled.length === 0 ? (
          <p className="opacity-70">{copy.planning.poolEmpty}</p>
        ) : (
          <>
            {pool.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold opacity-60">
                  {copy.planning.poolToSchedule}
                </h3>
                {BLOCK_CATEGORIES.map((category) => {
                  const inCategory = pool.filter((b) => b.category === category);
                  if (inCategory.length === 0) return null;
                  return (
                    <div key={category} className="flex flex-col gap-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wide opacity-50">
                        {copy.categories[category]}
                      </h4>
                      <ul className="flex flex-col gap-2">
                        {inCategory.map((b) => (
                          <PoolBlockCard
                            key={b.id}
                            block={{
                              id: b.id,
                              name: b.name,
                              category: b.category,
                              durationMin: b.durationMin,
                              expectedOutcome: b.expectedOutcome,
                              firstAction: b.firstAction,
                              notes: b.notes,
                            }}
                          />
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}

            {scheduled.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold opacity-60">
                  {copy.planning.scheduledTitle}
                </h3>
                {scheduledDates.map((date) => {
                  const dayBlocks = [...scheduledByDate.get(date)!].sort(
                    (a, b) =>
                      partIndex(a.partOfDay) - partIndex(b.partOfDay) ||
                      (a.dayOrder ?? 0) - (b.dayOrder ?? 0),
                  );
                  return (
                    <div key={date} className="flex flex-col gap-2">
                      <Link
                        href={`/day/${date}`}
                        className="text-sm font-medium underline underline-offset-4"
                        dir="auto"
                      >
                        {formatDayLabel(date, me.language)}
                      </Link>
                      <ul className="flex flex-col gap-2">
                        {dayBlocks.map((b) => (
                          <li
                            key={b.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-3"
                          >
                            <span dir="auto" className="font-medium">
                              {b.name}
                            </span>
                            <span className="text-sm opacity-50">
                              {b.partOfDay ? `${copy.parts[b.partOfDay]} · ` : ""}
                              {b.durationMin} {copy.planning.minutesShort}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </section>
  );
}
