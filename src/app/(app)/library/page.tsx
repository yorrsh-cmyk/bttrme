import { t } from "@/i18n/catalog";
import { BLOCK_CATEGORIES } from "@/domain/blockTypes";
import { archiveTemplate, unarchiveTemplate } from "@/server/actions/templates";
import { getLanguage } from "@/server/language";
import { listAllTemplates, listUsedTemplateIds, type Template } from "@/server/queries";
import { DeleteTemplateButton } from "@/ui/DeleteTemplateButton";
import { SubmitButton } from "@/ui/SubmitButton";
import { TemplateForm } from "@/ui/TemplateForm";

export default async function LibraryPage() {
  const copy = t(await getLanguage());
  const [templates, usedIds] = await Promise.all([listAllTemplates(), listUsedTemplateIds()]);
  const active = templates.filter((tpl) => tpl.archivedAt === null);
  const archived = templates.filter((tpl) => tpl.archivedAt !== null);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">{copy.nav.library}</h1>
        <p className="text-sm opacity-70">{copy.library.intro}</p>
      </header>

      <TemplateForm mode="create" />

      {active.length === 0 ? (
        <p className="opacity-70">{copy.library.empty}</p>
      ) : (
        <div className="flex flex-col gap-6">
          {BLOCK_CATEGORIES.map((category) => {
            const inCategory = active.filter((tpl) => tpl.category === category);
            if (inCategory.length === 0) return null;
            return (
              <div key={category} className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold opacity-60">{copy.categories[category]}</h2>
                <ul className="flex flex-col gap-2">
                  {inCategory.map((tpl) => (
                    <TemplateRow
                      key={tpl.id}
                      tpl={tpl}
                      used={usedIds.has(tpl.id)}
                      minutesLabel={copy.planning.minutesShort}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {archived.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-gray-200 pt-4">
          <h2 className="text-sm font-semibold opacity-60">{copy.library.archivedTitle}</h2>
          <p className="text-sm opacity-60">{copy.library.archivedIntro}</p>
          <ul className="flex flex-col gap-2">
            {archived.map((tpl) => (
              <li
                key={tpl.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3"
              >
                <span dir="auto" className="opacity-60">
                  {tpl.name}
                </span>
                <span className="flex shrink-0 items-center gap-4">
                  <form action={unarchiveTemplate}>
                    <input type="hidden" name="id" value={tpl.id} />
                    <SubmitButton className="text-sm underline underline-offset-4 opacity-70">
                      {copy.library.unarchive}
                    </SubmitButton>
                  </form>
                  {usedIds.has(tpl.id) ? null : <DeleteTemplateButton templateId={tpl.id} />}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function TemplateRow({
  tpl,
  used,
  minutesLabel,
}: {
  tpl: Template;
  used: boolean;
  minutesLabel: string;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-gray-200 px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span dir="auto" className="font-medium">
          {tpl.name}
        </span>
        <span className="shrink-0 text-sm opacity-60">
          {tpl.defaultDurationMin} {minutesLabel}
        </span>
      </div>
      <p dir="auto" className="text-sm opacity-70">
        {tpl.expectedOutcome}
      </p>
      <div className="flex items-center gap-4">
        <TemplateForm
          mode="edit"
          templateId={tpl.id}
          defaults={{
            name: tpl.name,
            category: tpl.category,
            durationMin: tpl.defaultDurationMin,
            expectedOutcome: tpl.expectedOutcome,
            firstAction: tpl.firstAction,
            notes: tpl.notes,
          }}
        />
        {/* Used templates carry history → archive only; unused → delete. */}
        {used ? <ArchiveButton id={tpl.id} /> : <DeleteTemplateButton templateId={tpl.id} />}
      </div>
    </li>
  );
}

async function ArchiveButton({ id }: { id: string }) {
  const copy = t(await getLanguage());
  return (
    <form action={archiveTemplate}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton className="text-sm underline underline-offset-4 opacity-70">
        {copy.library.archive}
      </SubmitButton>
    </form>
  );
}
