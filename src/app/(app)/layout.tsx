import Link from "next/link";
import { redirect } from "next/navigation";
import { dirFor, t } from "@/i18n/catalog";
import { getSessionUser } from "@/server/session";
import { NavTabs } from "@/ui/NavTabs";

// The signed-in shell (PRD 01 §3): full session validation against the DB,
// then header + tab navigation. Language here comes from the user row —
// the source of truth (FR-8).
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const me = await getSessionUser();
  if (!me) {
    redirect("/login");
  }

  const copy = t(me.language);
  const tabs = [
    { href: "/week", label: copy.nav.week },
    { href: "/", label: copy.nav.today },
    { href: "/library", label: copy.nav.library },
    { href: "/review", label: copy.nav.review },
  ];

  return (
    <div lang={me.language} dir={dirFor(me.language)} className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col">
      <header className="flex items-center justify-between px-4 pt-4 pb-2 sm:px-6">
        <Link href="/week" className="text-lg font-semibold">
          {copy.app.name}
        </Link>
        <Link href="/settings" className="text-sm underline underline-offset-4 opacity-70">
          {copy.nav.settings}
        </Link>
      </header>
      <NavTabs tabs={tabs} />
      <main className="flex-1 px-4 py-6 pb-24 sm:px-6 sm:pb-6">{children}</main>
    </div>
  );
}
