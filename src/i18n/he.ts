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
  review: {
    empty: "המבט אחורה יקרה כאן, כשיהיה שבוע להסתכל עליו.",
  },
  categories: {
    work: "עבודה",
    family: "משפחה",
    personal: "אישי",
    health: "בריאות",
    rest: "מנוחה",
  },
  library: {
    empty: "הפעולות יוצגו כאן.",
    intro: "פעולות שחוזרות על עצמן במהלך השבוע - מגדירים כל אחת פעם אחת.",
    createFirst: "להוסיף את סוג הפעולה הראשון",
    addTemplate: "סוג פעולה חדש",
    editTemplate: "עריכת סוג פעולה",
    archivedTitle: "ארכיון",
    archivedIntro: "מחוץ לתכנון; שבועות שעברו עדיין מחזיקים אותם.",
    field: {
      name: "שם",
      category: "קטגוריה",
      duration: "משך זמן",
      minutes: "דקות",
      custom: "מותאם אישית",
      expectedOutcome: "מטרה",
      firstAction: "צעד ראשון",
      notes: "הערות",
      optional: "לא חובה",
    },
    edit: "עריכה",
    archive: "ארכיון",
    unarchive: "להחזיר",
    delete: "מחיקה",
    deleteConfirm: "למחוק?",
  },
  planning: {
    goalsTitle: "מה חשוב השבוע",
    goalsIntro: "עד שלושה. הם נשארים מול העיניים בזמן שבונים את השבוע.",
    goalPlaceholder: "מטרה שבועית",
    saveGoals: "שמירה",
    goalsSaved: "נשמר.",
    poolTitle: "הבלוקים של השבוע",
    poolEmpty: "עוד אין בלוקים — אפשר להוסיף כמה מהספרייה.",
    addFromLibrary: "הוספה מהספרייה",
    addOneOff: "בלוק חד־פעמי",
    pickerTitle: "הוספת בלוק",
    pickerEmpty: "הספרייה שלך ריקה.",
    goToLibrary: "מעבר לספרייה",
    remove: "הסרה",
    edit: "עריכה",
    planNextWeek: "לתכנן את השבוע הבא",
    thisWeek: "השבוע הזה",
    minutesShort: "דק׳",
  },
  load: {
    hoursUnit: "ש׳",
    planned: "מתוכננות",
    heavy: "שבוע עמוס.",
    referenceLabel: "קו ייחוס",
  },
  errors: {
    required: "צריך למלא כאן.",
    too_long: "קצת ארוך מדי.",
    bad_category: "לבחור קטגוריה.",
    bad_duration: "לרשום משך בדקות.",
    bad_position: "המשבצת לא תקינה.",
    generic: "זה לא עבר — אפשר לנסות שוב.",
  },
  settings: {
    title: "הגדרות",
    language: "שפה",
    timezone: "אזור זמן",
    weekStart: "השבוע מתחיל ביום",
    weekStartSun: "ראשון",
    weekStartMon: "שני",
    loadThreshold: "קו ייחוס שבועי (שעות מתוכננות)",
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
