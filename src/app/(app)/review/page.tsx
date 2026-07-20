import { t } from "@/i18n/catalog";
import { getLanguage } from "@/server/language";

// Review — becomes daily/weekly reviews in M4. Placeholder (PRD 01 §12).
export default async function ReviewPage() {
  const copy = t(await getLanguage());
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">{copy.nav.review}</h1>
      <p className="opacity-70">{copy.review.empty}</p>
    </section>
  );
}
