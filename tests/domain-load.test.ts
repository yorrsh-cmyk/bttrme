import { describe, expect, it } from "vitest";
import { DEFAULT_LOAD_THRESHOLD_HOURS, computeLoad, type LoadBlock } from "@/domain/load";

const block = (category: LoadBlock["category"], durationMin: number): LoadBlock => ({
  category,
  durationMin,
});

describe("computeLoad", () => {
  it("is empty for no blocks", () => {
    const load = computeLoad([]);
    expect(load.totalMinutes).toBe(0);
    expect(load.plannedHours).toBe(0);
    expect(load.level).toBe("within");
    expect(load.byCategory).toEqual({ work: 0, family: 0, personal: 0, health: 0, rest: 0 });
  });

  it("sums per category and overall", () => {
    const load = computeLoad([block("work", 90), block("work", 30), block("family", 60)]);
    expect(load.byCategory.work).toBe(120);
    expect(load.byCategory.family).toBe(60);
    expect(load.totalMinutes).toBe(180);
  });

  it("excludes rest from the load figure but counts it in totals", () => {
    const load = computeLoad([block("work", 600), block("rest", 600)]);
    expect(load.totalMinutes).toBe(1200);
    expect(load.restMinutes).toBe(600);
    expect(load.nonRestMinutes).toBe(600);
    expect(load.plannedHours).toBe(10); // only the work 10h counts as load
  });

  it("rounds planned hours to one decimal", () => {
    const load = computeLoad([block("work", 95)]); // 1.5833h → 1.6
    expect(load.plannedHours).toBe(1.6);
  });

  it("stays 'within' at exactly the threshold, 'heavy' just past it", () => {
    const atThreshold = computeLoad([block("work", DEFAULT_LOAD_THRESHOLD_HOURS * 60)]);
    expect(atThreshold.level).toBe("within");

    const overByOneMinute = computeLoad([block("work", DEFAULT_LOAD_THRESHOLD_HOURS * 60 + 1)]);
    expect(overByOneMinute.level).toBe("heavy");
  });

  it("a week that is heavy only because of rest is still 'within'", () => {
    const load = computeLoad([block("rest", 40 * 60)]); // 40h of rest
    expect(load.level).toBe("within");
    expect(load.nonRestMinutes).toBe(0);
  });

  it("respects a custom threshold", () => {
    const blocks = [block("work", 6 * 60)];
    expect(computeLoad(blocks, 5).level).toBe("heavy");
    expect(computeLoad(blocks, 8).level).toBe("within");
  });

  it("a non-positive threshold disables the heavy signal", () => {
    const load = computeLoad([block("work", 100 * 60)], 0);
    expect(load.level).toBe("within");
  });

  it("ignores negative durations defensively", () => {
    const load = computeLoad([block("work", -30), block("work", 60)]);
    expect(load.byCategory.work).toBe(60);
    expect(load.totalMinutes).toBe(60);
  });
});
