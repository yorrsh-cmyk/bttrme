import { DEFAULT_LANGUAGE, t } from "@/i18n/catalog";

// Placeholder root page (skeleton stage). Replaced in M1 step 3 by the
// auth-gated (app) group with This Week as the default route.
export default function Home() {
  const copy = t(DEFAULT_LANGUAGE);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">{copy.app.name}</h1>
      <p className="text-base opacity-70">{copy.week.empty}</p>
    </main>
  );
}
