import { t } from "@/i18n/catalog";
import { getLanguage } from "@/server/language";

// Today — becomes the execution view in M3. Placeholder (PRD 01 §12).
export default async function TodayPage() {
  const copy = t(await getLanguage());
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">{copy.nav.today}</h1>
      <p className="opacity-70">{copy.today.empty}</p>
    </section>
  );
}
