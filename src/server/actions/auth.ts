"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { isLanguage, t, DEFAULT_LANGUAGE } from "@/i18n/catalog";
import { setLanguageCookie } from "@/server/language";
import { hashPassword, verifyPassword } from "@/server/password";
import { currentLockout, recordAttempt } from "@/server/rateLimit";
import { createSession, destroySession } from "@/server/session";

export interface LoginFormState {
  error: string | null;
}

// Verified when the username doesn't match, so both paths cost the same
// (no timing oracle on the single existing username).
let dummyHash: string | null = null;
async function getDummyHash(): Promise<string> {
  dummyHash ??= await hashPassword("dummy-password-for-timing");
  return dummyHash;
}

function safeNextPath(value: FormDataEntryValue | null): string {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/week";
}

export async function login(
  _prev: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const language = (() => {
    const raw = formData.get("language");
    return isLanguage(raw) ? raw : DEFAULT_LANGUAGE;
  })();
  const copy = t(language);

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const lockout = await currentLockout();
  if (lockout.locked) {
    // Neutral by design; attempts during lockout are not recorded (no
    // self-extending punishment).
    return { error: copy.login.lockedOut };
  }

  const rows = await db.select().from(user).where(eq(user.username, username)).limit(1);
  const found = rows[0];

  const ok = found
    ? await verifyPassword(found.passwordHash, password)
    : (await verifyPassword(await getDummyHash(), password), false);

  await recordAttempt(ok);
  if (!ok || !found) {
    return { error: copy.login.noMatch };
  }

  // The login-screen language choice persists on the user row (FR-8).
  if (found.language !== language) {
    await db.update(user).set({ language }).where(eq(user.id, found.id));
  }
  await setLanguageCookie(language);
  await createSession(found.id);

  redirect(safeNextPath(formData.get("next")));
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
