import { describe, expect, it } from "vitest";
import { en } from "@/i18n/en";
import { he } from "@/i18n/he";

// Guard test (plan §6): the two catalogs expose identical key sets, so a
// missing translation is a build failure, not a runtime surprise. TypeScript
// already enforces this at compile time (he is typed as Catalog = typeof en);
// this test makes the promise hold at runtime too, independent of the types.

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object") {
      return flattenKeys(value as Record<string, unknown>, path);
    }
    return [path];
  });
}

describe("catalog parity", () => {
  it("en and he have identical key sets", () => {
    expect(flattenKeys(he).sort()).toEqual(flattenKeys(en).sort());
  });

  it("every leaf is a non-empty string in both catalogs", () => {
    for (const catalog of [en, he]) {
      const keys = flattenKeys(catalog);
      for (const key of keys) {
        const value = key
          .split(".")
          .reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], catalog);
        expect(typeof value, `${key} must be a string`).toBe("string");
        expect((value as string).trim().length, `${key} must not be empty`).toBeGreaterThan(0);
      }
    }
  });
});
