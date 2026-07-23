"use client";

import { createContext, useContext } from "react";
import type { Catalog, Language } from "@/i18n/catalog";

// Client-side access to the typed catalog. The (app) layout resolves the
// user's language server-side and hands the catalog down once; client
// components read it with useT(), keeping every string catalog-sourced
// (satisfies the no-hardcoded-JSX ESLint guard).

interface I18nValue {
  t: Catalog;
  language: Language;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  language,
  catalog,
  children,
}: {
  language: Language;
  catalog: Catalog;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ t: catalog, language }}>{children}</I18nContext.Provider>
  );
}

function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useT must be used within I18nProvider");
  return value;
}

export function useT(): Catalog {
  return useI18n().t;
}

export function useLanguage(): Language {
  return useI18n().language;
}
