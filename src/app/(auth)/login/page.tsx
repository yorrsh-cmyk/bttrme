import Link from "next/link";
import { redirect } from "next/navigation";
import { dirFor, isLanguage, t, type Language } from "@/i18n/catalog";
import { getLanguage } from "@/server/language";
import { getSessionUser } from "@/server/session";
import { LoginForm } from "@/ui/LoginForm";

interface LoginPageProps {
  searchParams: Promise<{ lang?: string; next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await getSessionUser()) {
    redirect("/week");
  }

  const params = await searchParams;
  const language: Language = isLanguage(params.lang) ? params.lang : await getLanguage();
  const copy = t(language);
  const other: Language = language === "he" ? "en" : "he";

  const toggleHref = {
    pathname: "/login",
    query: { lang: other, ...(params.next ? { next: params.next } : {}) },
  };

  return (
    <main
      lang={language}
      dir={dirFor(language)}
      className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 p-6"
    >
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">{copy.app.name}</h1>
        <Link
          href={toggleHref}
          lang={other}
          dir={dirFor(other)}
          className="text-sm underline underline-offset-4 opacity-70"
        >
          {copy.languageNames[other]}
        </Link>
      </div>
      <LoginForm
        language={language}
        next={params.next ?? null}
        copy={{
          title: copy.login.title,
          username: copy.login.username,
          password: copy.login.password,
          submit: copy.login.submit,
        }}
      />
    </main>
  );
}
