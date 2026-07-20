import { describe, expect, it } from "vitest";
import { en } from "@/i18n/en";
import { he } from "@/i18n/he";
import { FORBIDDEN_WORDS } from "@/i18n/forbidden";

// The vocabulary guard (Phase 1 §3): judgment words must never appear in the
// UI, in either language. This encodes the product's core promise in CI.

function flattenValues(obj: Record<string, unknown>, prefix = ""): Array<[string, string]> {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object") {
      return flattenValues(value as Record<string, unknown>, path);
    }
    return [[path, String(value)]] as Array<[string, string]>;
  });
}

describe("vocabulary guard", () => {
  const catalogs = { en, he } as const;

  for (const [language, catalog] of Object.entries(catalogs)) {
    it(`the ${language} catalog contains no forbidden judgment words`, () => {
      const entries = flattenValues(catalog);
      const forbidden = FORBIDDEN_WORDS[language as keyof typeof FORBIDDEN_WORDS];
      const violations: string[] = [];

      for (const [key, value] of entries) {
        // languageNames are proper nouns shared across catalogs; the guard
        // still checks them, but they're checked against both lists anyway.
        const haystack = value.toLowerCase();
        for (const stem of forbidden) {
          if (haystack.includes(stem.toLowerCase())) {
            violations.push(`${key} = "${value}" contains forbidden stem "${stem}"`);
          }
        }
      }

      expect(violations, violations.join("\n")).toEqual([]);
    });
  }

  it("forbidden lists exist for both languages and are non-trivial", () => {
    expect(FORBIDDEN_WORDS.en.length).toBeGreaterThanOrEqual(10);
    expect(FORBIDDEN_WORDS.he.length).toBeGreaterThanOrEqual(10);
  });
});
