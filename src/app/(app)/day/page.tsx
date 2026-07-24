import { redirect } from "next/navigation";
import { todayInTimeZone } from "@/domain/weekCycle";
import { getSessionUser } from "@/server/session";

// Bare /day lands on today's scheduling view.
export default async function DayIndexPage() {
  const me = await getSessionUser();
  if (!me) redirect("/login");
  redirect(`/day/${todayInTimeZone(new Date(), me.timezone)}`);
}
