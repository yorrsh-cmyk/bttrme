import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LANGUAGE, isLanguage, type Language } from "@/i18n/catalog";

// The user row is the source of truth for language (FR-8); this cookie is a
// render-time mirror so the root layout can set <html lang/dir> without a
// database read on every request. Kept in sync on login and settings save.

export const LANGUAGE_COOKIE = "bttrme_lang";

export async function getLanguage(): Promise<Language> {
  const store = await cookies();
  const value = store.get(LANGUAGE_COOKIE)?.value;
  return isLanguage(value) ? value : DEFAULT_LANGUAGE;
}

export async function setLanguageCookie(language: Language): Promise<void> {
  const store = await cookies();
  store.set(LANGUAGE_COOKIE, language, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
