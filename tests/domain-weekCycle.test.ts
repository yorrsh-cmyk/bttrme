import { describe, expect, it } from "vitest";
import {
  addDays,
  civilPartsInTimeZone,
  isWeekPlannable,
  nextWeekStart,
  previousWeekStart,
  todayInTimeZone,
  weekEnd,
  weekStartForDate,
  weekStartForInstant,
  weekdayOf,
} from "@/domain/weekCycle";

const TZ = "Asia/Jerusalem";

describe("civilPartsInTimeZone", () => {
  it("reads the wall-clock date in the target timezone", () => {
    // 2026-07-20T22:30Z is 2026-07-21 01:30 in Jerusalem (UTC+3 summer)
    const parts = civilPartsInTimeZone(new Date("2026-07-20T22:30:00Z"), TZ);
    expect(parts).toMatchObject({ year: 2026, month: 7, day: 21 });
  });

  it("crosses the local midnight correctly (not UTC midnight)", () => {
    // 2026-01-15T23:00Z is 2026-01-16 01:00 in Jerusalem (UTC+2 winter)
    const parts = civilPartsInTimeZone(new Date("2026-01-15T23:00:00Z"), TZ);
    expect(parts.day).toBe(16);
  });
});

describe("addDays / weekdayOf", () => {
  it("adds and subtracts across month and year boundaries", () => {
    expect(addDays("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01"); // 2026 not a leap year
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29"); // 2024 is a leap year
  });

  it("knows weekdays (0 = Sunday)", () => {
    expect(weekdayOf("2026-07-19")).toBe(0); // Sunday
    expect(weekdayOf("2026-07-20")).toBe(1); // Monday
    expect(weekdayOf("2026-07-25")).toBe(6); // Saturday
  });
});

describe("weekStartForDate (Sunday weeks)", () => {
  it("returns the same day when it is already the week start", () => {
    expect(weekStartForDate("2026-07-19", "sun")).toBe("2026-07-19"); // a Sunday
  });

  it("rolls back to the containing Sunday", () => {
    expect(weekStartForDate("2026-07-20", "sun")).toBe("2026-07-19"); // Mon → Sun
    expect(weekStartForDate("2026-07-25", "sun")).toBe("2026-07-19"); // Sat → Sun
  });

  it("supports Monday-start weeks too", () => {
    expect(weekStartForDate("2026-07-19", "mon")).toBe("2026-07-13"); // Sun → prev Mon
    expect(weekStartForDate("2026-07-20", "mon")).toBe("2026-07-20"); // Mon → same
  });
});

describe("weekStartForInstant across DST (Asia/Jerusalem)", () => {
  // Israel DST 2026: begins Fri 2026-03-27, ends Sun 2026-10-25.
  it("holds the Sunday boundary through the spring-forward week", () => {
    // Thursday 2026-03-26 (before DST) and Sunday 2026-03-29 (after) share week 03-22
    expect(weekStartForInstant(new Date("2026-03-26T10:00:00Z"), TZ, "sun")).toBe("2026-03-22");
    expect(weekStartForInstant(new Date("2026-03-29T10:00:00Z"), TZ, "sun")).toBe("2026-03-29");
  });

  it("holds the boundary through the autumn fall-back Sunday", () => {
    // 2026-10-25 is itself a Sunday and the DST-end day → it is its own week start
    expect(weekStartForInstant(new Date("2026-10-25T10:00:00Z"), TZ, "sun")).toBe("2026-10-25");
    // Saturday just before still belongs to the prior Sunday 10-18
    expect(weekStartForInstant(new Date("2026-10-24T10:00:00Z"), TZ, "sun")).toBe("2026-10-18");
  });

  it("uses local (not UTC) date near midnight", () => {
    // 2026-07-19T22:00Z = 2026-07-20 01:00 Jerusalem (Monday) → week start 07-19
    expect(weekStartForInstant(new Date("2026-07-19T22:00:00Z"), TZ, "sun")).toBe("2026-07-19");
    // 2026-07-18T22:00Z = 2026-07-19 01:00 Jerusalem (Sunday) → week start 07-19
    expect(weekStartForInstant(new Date("2026-07-18T22:00:00Z"), TZ, "sun")).toBe("2026-07-19");
  });
});

describe("week neighbours", () => {
  it("computes next/previous/end", () => {
    expect(nextWeekStart("2026-07-19")).toBe("2026-07-26");
    expect(previousWeekStart("2026-07-19")).toBe("2026-07-12");
    expect(weekEnd("2026-07-19")).toBe("2026-07-25");
  });

  it("next week is 7 days even across a DST change", () => {
    // Week containing the spring-forward → next week still lands on the Sunday
    expect(nextWeekStart("2026-03-22")).toBe("2026-03-29");
  });
});

describe("isWeekPlannable", () => {
  const now = new Date("2026-07-22T09:00:00Z"); // Wed 2026-07-22, current week 07-19

  it("allows the current and past weeks", () => {
    expect(isWeekPlannable("2026-07-19", now, TZ)).toBe(true);
    expect(isWeekPlannable("2026-07-12", now, TZ)).toBe(true);
  });

  it("does not offer next week mid-week (before the Friday horizon)", () => {
    expect(isWeekPlannable("2026-07-26", now, TZ)).toBe(false);
  });

  it("offers next week from two days before it starts (the Friday)", () => {
    const friday = new Date("2026-07-24T09:00:00Z"); // Fri 2026-07-24
    expect(isWeekPlannable("2026-07-26", friday, TZ)).toBe(true);
  });

  it("never offers the week after next", () => {
    const friday = new Date("2026-07-24T09:00:00Z");
    expect(isWeekPlannable("2026-08-02", friday, TZ)).toBe(false);
  });
});

describe("todayInTimeZone", () => {
  it("returns the civil date in the user's zone", () => {
    expect(todayInTimeZone(new Date("2026-07-20T22:30:00Z"), TZ)).toBe("2026-07-21");
  });
});
