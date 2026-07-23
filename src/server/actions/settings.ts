"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { isLanguage } from "@/i18n/catalog";
import { setLanguageCookie } from "@/server/language";
import { getSessionUser } from "@/server/session";

export interface SettingsFormState {
  saved: boolean;
}

function isTimezone(value: string): boolean {
  return Intl.supportedValuesOf("timeZone").includes(value);
}

export async function updateSettings(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const me = await getSessionUser();
  if (!me) return { saved: false };

  const language = formData.get("language");
  const timezone = String(formData.get("timezone") ?? "");
  const weekStartDay = formData.get("weekStartDay");
  const loadThresholdHours = Number(formData.get("loadThresholdHours") ?? "");

  if (
    !isLanguage(language) ||
    !isTimezone(timezone) ||
    (weekStartDay !== "sun" && weekStartDay !== "mon") ||
    !Number.isInteger(loadThresholdHours) ||
    loadThresholdHours < 0 ||
    loadThresholdHours > 168
  ) {
    return { saved: false };
  }

  await db
    .update(user)
    .set({ language, timezone, weekStartDay, loadThresholdHours })
    .where(eq(user.id, me.id));
  await setLanguageCookie(language);
  revalidatePath("/", "layout");
  return { saved: true };
}
