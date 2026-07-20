import { t } from "@/i18n/catalog";
import { getLanguage } from "@/server/language";

// Library — becomes template CRUD in M2. Placeholder (PRD 01 §12).
export default async function LibraryPage() {
  const copy = t(await getLanguage());
  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">{copy.nav.library}</h1>
      <p className="opacity-70">{copy.library.empty}</p>
    </section>
  );
}
