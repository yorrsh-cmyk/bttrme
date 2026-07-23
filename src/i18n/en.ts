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
  review: {
    empty: "Reviews will happen here, once there is a week to look at.",
  },
  categories: {
    work: "Work",
    family: "Family",
    personal: "Personal",
    health: "Health",
    rest: "Rest",
  },
  library: {
    empty: "Your library of actions will live here.",
    intro: "The kinds of actions your life is made of — define each once.",
    createFirst: "Add your first action type",
    addTemplate: "New action type",
    editTemplate: "Edit action type",
    archivedTitle: "Set aside",
    archivedIntro: "Kept out of planning; past weeks still hold them.",
    field: {
      name: "Name",
      category: "Category",
      duration: "Usual length",
      minutes: "minutes",
      expectedOutcome: "What it's for",
      firstAction: "First step",
      notes: "Notes",
      optional: "optional",
    },
    edit: "Edit",
    archive: "Set aside",
    unarchive: "Bring back",
  },
  planning: {
    goalsTitle: "What matters this week",
    goalsIntro: "Up to three. They stay in view while you build the week.",
    goalPlaceholder: "A focus for the week",
    saveGoals: "Save",
    goalsSaved: "Saved.",
    poolTitle: "This week's blocks",
    poolEmpty: "No blocks yet — add a few from the library.",
    addFromLibrary: "Add from library",
    addOneOff: "One-off block",
    pickerTitle: "Add a block",
    pickerEmpty: "Your library is empty.",
    goToLibrary: "Go to the library",
    remove: "Remove",
    edit: "Edit",
    planNextWeek: "Plan next week",
    thisWeek: "This week",
    minutesShort: "min",
  },
  load: {
    hoursUnit: "h",
    planned: "planned",
    heavy: "A heavy week.",
    referenceLabel: "reference",
  },
  errors: {
    required: "This one's needed.",
    too_long: "A little too long.",
    bad_category: "Pick a category.",
    bad_duration: "Give a length in minutes.",
    bad_position: "That slot isn't valid.",
    generic: "That didn't go through — try again.",
  },
  settings: {
    title: "Settings",
    language: "Language",
    timezone: "Timezone",
    weekStart: "Week starts on",
    weekStartSun: "Sunday",
    weekStartMon: "Monday",
    loadThreshold: "Weekly reference (planned hours)",
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
