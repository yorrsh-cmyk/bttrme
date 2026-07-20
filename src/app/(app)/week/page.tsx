import { t } from "@/i18n/catalog";
import { getLanguage } from "@/server/language";

// This Week — the post-login landing (PRD 01 §8): one neutral sentence,
// no onboarding tour. Becomes the planning view in M2.
export default async function WeekPage() {
  const copy = t(await getLanguage());
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">{copy.nav.week}</h1>
      <p className="opacity-70">{copy.week.empty}</p>
    </section>
  );
}
