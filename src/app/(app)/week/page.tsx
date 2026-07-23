import Link from "next/link";
import { redirect } from "next/navigation";
import { BLOCK_CATEGORIES } from "@/domain/blockTypes";
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
  listPoolBlocks,
} from "@/server/queries";
import { getSessionUser } from "@/server/session";
import { BlockPicker } from "@/ui/BlockPicker";
import { GoalsEditor } from "@/ui/GoalsEditor";
import { LoadSignal } from "@/ui/LoadSignal";
import { PoolBlockCard } from "@/ui/PoolBlockCard";

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
  const [goals, blocks, templates] = await Promise.all([
    listGoals(week.id),
    listPoolBlocks(week.id),
    listActiveTemplates(),
  ]);

  const goalsByPosition: Record<number, string> = {};
  for (const g of goals) goalsByPosition[g.position] = g.text;

  const load = computeLoad(
    blocks.map((b) => ({ category: b.category, durationMin: b.durationMin })),
    me.loadThresholdHours,
  );

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

        {blocks.length === 0 ? (
          <p className="opacity-70">{copy.planning.poolEmpty}</p>
        ) : (
          <div className="flex flex-col gap-5">
            {BLOCK_CATEGORIES.map((category) => {
              const inCategory = blocks.filter((b) => b.category === category);
              if (inCategory.length === 0) return null;
              return (
                <div key={category} className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold opacity-60">
                    {copy.categories[category]}
                  </h3>
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
      </section>
    </section>
  );
}
