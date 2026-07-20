import type { Language } from "./catalog";

// The vocabulary guard (Phase 1 §3, plan §6): judgment words are structurally
// forbidden in the UI, per language. A hit in either catalog fails CI.
//
// Matching is by lowercase substring (stems), because Hebrew prefixes attach
// to words (ה/ל/ב/ש) and \b does not work for Hebrew in JS regexes. A false
// positive is acceptable: it forces a human to look, which is the point.
//
// The English starter list comes from the approved planning docs. The Hebrew
// list is a DRAFT: it is agreed (and grown) with Michael in the M1 vocabulary
// session and at every milestone's Hebrew copy review.

export const FORBIDDEN_WORDS: Record<Language, readonly string[]> = {
  en: [
    "fail", // covers failed, failure
    "overdue",
    "lazy",
    "laziness",
    "behind schedule",
    "falling behind",
    "streak",
    "procrastinat", // covers procrastinate/-ion/-ing
    "guilt",
    "shame",
    "wasted",
    "slacking",
    "unproductive",
    "excuse",
  ],
  he: [
    "נכשל", // failed
    "כישלון", // failure
    "כשלון",
    "באיחור", // overdue/late
    "עצלן", // lazy
    "עצלות",
    "בפיגור", // behind
    "רצף ימים", // streak ("רצף" alone would over-match)
    "דחיינות", // procrastination
    "אשמה", // guilt
    "בושה", // shame
    "בזבזת", // you wasted
    "תירוץ", // excuse
  ],
};
