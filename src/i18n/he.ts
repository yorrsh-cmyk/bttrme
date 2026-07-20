import type { Catalog } from "./en";

// Hebrew catalog. This is writing, not translation (Gate 6): the Hebrew ear
// is the authority on judgment-free phrasing. Every string here is a DRAFT
// until Michael reviews it in the milestone's copy review / vocabulary session.

export const he: Catalog = {
  app: {
    name: "Bttrme",
  },
  login: {
    title: "כניסה",
    username: "שם משתמש",
    password: "סיסמה",
    submit: "כניסה",
    noMatch: "הפרטים לא תואמים. אפשר לנסות שוב.",
    lockedOut: "אפשר לנסות שוב בעוד כמה דקות.",
  },
  nav: {
    week: "השבוע",
    today: "היום",
    library: "הספרייה",
    review: "מבט אחורה",
    settings: "הגדרות",
  },
  week: {
    empty: "עוד אין כאן כלום. המסך הזה יחזיק את השבוע שלך.",
  },
  today: {
    empty: "הבלוקים של היום יופיעו כאן.",
  },
  library: {
    empty: "ספריית הפעולות שלך תגור כאן.",
  },
  review: {
    empty: "המבט אחורה יקרה כאן, כשיהיה שבוע להסתכל עליו.",
  },
  settings: {
    title: "הגדרות",
    language: "שפה",
    timezone: "אזור זמן",
    weekStart: "השבוע מתחיל ביום",
    weekStartSun: "ראשון",
    weekStartMon: "שני",
    signOut: "יציאה",
    saved: "נשמר.",
  },
  // ששת מצבי הבלוק — טיוטה בלבד. הניסוח הסופי נקבע בשיחת אוצר המילים.
  states: {
    completed: "הושלם",
    notCompleted: "לא הושלם",
    deferred: "נדחה להמשך",
    moved: "הועבר",
    skipped: "דולג",
    stoppedEarly: "נעצר מוקדם",
  },
  languageNames: {
    he: "עברית",
    en: "English",
  },
  common: {
    save: "שמירה",
    cancel: "ביטול",
    undo: "ביטול פעולה",
  },
};
