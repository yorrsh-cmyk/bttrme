import { redirect } from "next/navigation";
import { t } from "@/i18n/catalog";
import { logout } from "@/server/actions/auth";
import { getSessionUser } from "@/server/session";
import { SettingsForm } from "@/ui/SettingsForm";

// PRD 01 FR-6: timezone, week-start day, language — stored on the user row.
// FR-5: logout lives here.
export default async function SettingsPage() {
  const me = await getSessionUser();
  if (!me) {
    redirect("/login");
  }

  const copy = t(me.language);

  return (
    <section className="flex max-w-md flex-col gap-8">
      <h1 className="text-xl font-semibold">{copy.settings.title}</h1>
      <SettingsForm
        initial={{
          language: me.language,
          timezone: me.timezone,
          weekStartDay: me.weekStartDay,
          loadThresholdHours: me.loadThresholdHours,
        }}
        timezones={Intl.supportedValuesOf("timeZone")}
        copy={{
          language: copy.settings.language,
          timezone: copy.settings.timezone,
          weekStart: copy.settings.weekStart,
          weekStartSun: copy.settings.weekStartSun,
          weekStartMon: copy.settings.weekStartMon,
          loadThreshold: copy.settings.loadThreshold,
          save: copy.common.save,
          saved: copy.settings.saved,
          languageNames: copy.languageNames,
        }}
      />
      <form action={logout}>
        <button
          type="submit"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
        >
          {copy.settings.signOut}
        </button>
      </form>
    </section>
  );
}
