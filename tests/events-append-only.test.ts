import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Guard test (plan §6, binding constraint 4): the events table is append-only.
// This statically scans all source for update/delete call sites against it.
// `src/db/events.ts` is the only sanctioned write path, and it only inserts.

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const FORBIDDEN_PATTERNS = [
  /\.update\(\s*events\b/, // db.update(events)
  /\.delete\(\s*events\b/, // db.delete(events)
  /(UPDATE|DELETE\s+FROM)\s+"?events"?/i, // raw SQL
];

describe("events append-only guard", () => {
  it("no update/delete call sites against events anywhere in src/ or scripts/", () => {
    const root = join(__dirname, "..");
    const files = [...sourceFiles(join(root, "src")), ...sourceFiles(join(root, "scripts"))];
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
          violations.push(`${file} matches ${pattern}`);
        }
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
