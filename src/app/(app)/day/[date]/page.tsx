import Link from "next/link";
import { redirect } from "next/navigation";
import { PARTS_OF_DAY, type PartOfDay } from "@/domain/blockTypes";
import {
  addDays,
  isWeekPlannable,
  todayInTimeZone,
  weekEnd,
  weekStartForDate,
  type WeekStartDay,
} from "@/domain/weekCycle";
import { localeFor, t } from "@/i18n/catalog";
import {
  getOrCreateWeek,
  listDayBlocks,
  listGoals,
  listPoolBlocks,
} from "@/server/queries";
import { getSessionUser } from "@/server/session";
import { PlacedControls } from "@/ui/PlacedControls";
import { PoolPlacer } from "@/ui/PoolPlacer";

function formatDay(date: string, language: "he" | "en"): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Intl.DateTimeFormat(localeFor(language), {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export default async function DayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  const copy = t(me.language);
  const now = new Date();
  const tz = me.timezone;
  const weekStartDay = me.weekStartDay as WeekStartDay;
  const today = todayInTimeZone(now, tz);

  const { date } = await params;
  // Refuse malformed or past dates (no scheduling into the past, FR-4), and any
  // week that isn't plannable yet — land on today.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today) redirect(`/day/${today}`);
  const weekStart = weekStartForDate(date, weekStartDay);
  if (!isWeekPlannable(weekStart, now, tz, weekStartDay)) redirect(`/day/${today}`);

  const wk = await getOrCreateWeek(weekStart);
  const [pool, placed, goals] = await Promise.all([
    listPoolBlocks(wk.id),
    listDayBlocks(date),
    listGoals(wk.id),
  ]);

  // Move targets: any other day of this week that is today-or-later.
  const lastDay = weekEnd(weekStart);
  const moveTargets: { date: string; label: string }[] = [];
  for (let d = weekStart; d <= lastDay; d = addDays(d, 1)) {
    if (d !== date && d >= today) moveTargets.push({ date: d, label: formatDay(d, me.language) });
  }

  const isCurrent = date === today;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-3">
        <h1 dir="auto" className="text-xl font-semibold">
          {formatDay(date, me.language)}
        </h1>
        {isCurrent ? (
          <Link href="/" className="text-sm underline underline-offset-4 opacity-70">
            {copy.nav.today}
          </Link>
        ) : (
          <Link href={`/day/${today}`} className="text-sm underline underline-offset-4 opacity-70">
            {copy.nav.today}
          </Link>
        )}
      </header>

      {/* What's already on the day, by part of day */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{copy.scheduling.onTheDay}</h2>
        {placed.length === 0 ? (
          <p className="opacity-70">{copy.scheduling.dayEmpty}</p>
        ) : (
          PARTS_OF_DAY.map((part) => {
            const inPart = placed.filter((b) => b.partOfDay === part);
            if (inPart.length === 0) return null;
            const scheduledIds = inPart.filter((b) => b.status === "scheduled").map((b) => b.id);
            return (
              <div key={part} className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold opacity-60">{copy.parts[part]}</h3>
                <ul className="flex flex-col gap-2">
                  {inPart.map((b) => {
                    const orderPos = scheduledIds.indexOf(b.id);
                    return (
                      <li
                        key={b.id}
                        className="flex flex-col gap-2 rounded-xl border border-gray-200 p-3"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span dir="auto" className="font-medium">
                            {b.name}
                          </span>
                          <span className="text-sm opacity-50">
                            {b.startTime ? `${b.startTime} · ` : ""}
                            {b.durationMin} {copy.planning.minutesShort}
                          </span>
                        </div>
                        {b.status === "scheduled" && (
                          <PlacedControls
                            blockId={b.id}
                            partOfDay={part as PartOfDay}
                            upId={orderPos > 0 ? scheduledIds[orderPos - 1]! : null}
                            downId={
                              orderPos >= 0 && orderPos < scheduledIds.length - 1
                                ? scheduledIds[orderPos + 1]!
                                : null
                            }
                            moveTargets={moveTargets}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </section>

      {/* The week pool — tap a part of day to place a block onto this day */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{copy.scheduling.fromPool}</h2>
          <Link href="/week" className="text-sm underline underline-offset-4 opacity-70">
            {copy.nav.week}
          </Link>
        </div>
        {pool.length === 0 ? (
          <p className="opacity-70">{copy.scheduling.poolEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pool.map((b) => (
              <PoolPlacer
                key={b.id}
                blockId={b.id}
                date={date}
                name={b.name}
                durationLabel={`${b.durationMin} ${copy.planning.minutesShort}`}
                goals={goals.map((g) => ({ id: g.id, text: g.text }))}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Placement auto-saves; this is the clear "I'm done here" exit that
          lands back on the main day view (Today). */}
      <Link
        href="/"
        className="min-h-12 rounded-xl bg-gray-900 px-5 py-3 text-center font-semibold text-white"
      >
        {copy.scheduling.backToToday}
      </Link>
    </section>
  );
}
