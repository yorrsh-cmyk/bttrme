import { en, type Catalog } from "./en";
import { he } from "./he";

export type { Catalog };

export type Language = "he" | "en";

export const LANGUAGES: readonly Language[] = ["he", "en"] as const;

export const DEFAULT_LANGUAGE: Language = "he";

const catalogs: Record<Language, Catalog> = { en, he };

/** Text direction for a language. Hebrew is RTL end to end (Gate 6). */
export function dirFor(language: Language): "rtl" | "ltr" {
  return language === "he" ? "rtl" : "ltr";
}

/** Returns the full typed catalog for a language. Usage: `t(lang).nav.week` */
export function t(language: Language): Catalog {
  return catalogs[language];
}

export function isLanguage(value: unknown): value is Language {
  return value === "he" || value === "en";
}

/** Locale string for Intl.DateTimeFormat (weeks start Sunday in both). */
export function localeFor(language: Language): string {
  return language === "he" ? "he-IL" : "en-US";
}
