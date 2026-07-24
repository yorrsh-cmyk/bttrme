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
  parts: {
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
  },
  // The execution moment — the most sensitive screen. Silence, no judgment, no
  // aggregate numbers, no red (PRD 03 §6). Labels are neutral; facts belong to
  // the block, never to "you".
  execution: {
    firstStep: "First step",
    doneWhen: "Done when",
    whyToday: "Why today",
    // Neutral time display for an active block (FR-10). Overrun is not an error.
    elapsed: "elapsed",
    planned: "planned",
    minutesShort: "min",
    // The four responses (each ≤ 2 taps).
    start: "Start",
    defer: "Later today",
    move: "Another day",
    skip: "Skip",
    // Close-out. The distinction is OUTCOME, not time: "Done" = I finished what
    // it was for; "Stopped partway" = I ended it having done part. Both are valid.
    done: "Done",
    stoppedEarly: "Stopped partway",
    // Stale active-block prompt (FR-7): asked, never auto-failed.
    stillGoing: "Still going?",
    // Calm empty / finished states — no counts, no praise.
    nothingMore: "Nothing more scheduled for this part of the day.",
    planToday: "Plan today",
    skipUndone: "Skip undone.",
  },
  // Recovery — a passed window or a return after days away. No red, no
  // exclamation marks, no count-badges (FR-11/FR-12). A miss is never a debt.
  recovery: {
    passedTitle: "These blocks' time has passed",
    passedIntro: "Pick up any of them, or set them aside for today.",
    skipAll: "Set them aside for today",
    absenceTitle: "Good to see you",
    absenceIntro: "Some days went by. You can start fresh from today.",
    archive: "Start fresh from today",
  },
  // Placing pool blocks onto a day (PRD 03 §5 scheduling).
  scheduling: {
    title: "Plan the day",
    fromPool: "From this week",
    poolEmpty: "Nothing in the week's pool to place here.",
    onTheDay: "On the day",
    dayEmpty: "Nothing placed on this day yet.",
    place: "Place",
    add: "Add",
    time: "Time",
    whyThisDay: "Why this day",
    noGoalLink: "No link",
    backToPool: "Back to the pool",
    moveTitle: "Move to another day",
    up: "↑",
    down: "↓",
    backToToday: "Back to today",
    done: "Done",
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
    empty: "Your actions will show here.",
    intro: "Actions that recur through your week — define each one once.",
    createFirst: "Add your first action type",
    addTemplate: "New action type",
    editTemplate: "Edit action type",
    archivedTitle: "Archive",
    archivedIntro: "Kept out of planning; past weeks still hold them.",
    field: {
      name: "Name",
      category: "Category",
      duration: "Duration",
      minutes: "minutes",
      custom: "Custom",
      expectedOutcome: "Goal",
      firstAction: "First step",
      notes: "Notes",
      optional: "optional",
    },
    edit: "Edit",
    archive: "Archive",
    unarchive: "Bring back",
    delete: "Delete",
    deleteConfirm: "Delete?",
  },
  planning: {
    goalsTitle: "What matters this week",
    goalsIntro: "Up to three. They stay in view while you build the week.",
    goalPlaceholder: "Weekly goal",
    saveGoals: "Save",
    goalsSaved: "Saved.",
    poolTitle: "This week's blocks",
    poolToSchedule: "Not yet placed on a day",
    scheduledTitle: "On your days",
    poolEmpty: "No blocks yet — add a few from the library.",
    addFromLibrary: "Add from library",
    addOneOff: "One-off block",
    pickerTitle: "Add a block",
    pickerEmpty: "Your library is empty.",
    goToLibrary: "Go to the library",
    remove: "Remove",
    delete: "Delete",
    deleteConfirm: "Delete?",
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
    stoppedEarly: "Stopped partway",
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
