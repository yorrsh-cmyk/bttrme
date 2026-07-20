// English catalog. The shape of this object IS the catalog contract:
// `he.ts` must expose exactly the same keys (typed + tested).
// Vocabulary rule (Phase 1): no judgment words — see forbidden.ts and the guard test.

export const en = {
  app: {
    name: "Bttrme",
  },
  login: {
    title: "Sign in",
    username: "Username",
    password: "Password",
    submit: "Sign in",
    // Neutral by design: no "wrong", no "failed" (PRD 01 FR-4)
    noMatch: "That didn't match. Try again.",
    lockedOut: "Try again in a little while.",
  },
  nav: {
    week: "This Week",
    today: "Today",
    library: "Library",
    review: "Review",
    settings: "Settings",
  },
  week: {
    empty: "Nothing lives here yet. This screen will hold your week.",
  },
  today: {
    empty: "Today's blocks will appear here.",
  },
  library: {
    empty: "Your library of actions will live here.",
  },
  review: {
    empty: "Reviews will happen here, once there is a week to look at.",
  },
  settings: {
    title: "Settings",
    language: "Language",
    timezone: "Timezone",
    weekStart: "Week starts on",
    weekStartSun: "Sunday",
    weekStartMon: "Monday",
    signOut: "Sign out",
    saved: "Saved.",
  },
  // The six core state words (Phase 1 §3). DRAFTS — final wording is set
  // in the Hebrew vocabulary session and mirrored back here if needed.
  states: {
    completed: "Completed",
    notCompleted: "Not completed",
    deferred: "Deferred",
    moved: "Moved",
    skipped: "Skipped",
    stoppedEarly: "Stopped early",
  },
  languageNames: {
    // Each language is always written in itself, in both catalogs
    he: "עברית",
    en: "English",
  },
  common: {
    save: "Save",
    cancel: "Cancel",
    undo: "Undo",
  },
};

export type Catalog = typeof en;
