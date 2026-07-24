"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { ENTITY, EVENT, appendEvent } from "@/db/events";
import { block, blockTemplate } from "@/db/schema";
import type { BlockCategory } from "@/domain/blockTypes";
import { requireUser } from "@/server/session";
import {
  LIMITS,
  category,
  durationMinutes,
  optionalText,
  requiredText,
  type FieldError,
} from "@/server/validate";

export interface TemplateFormState {
  error: FieldError | null;
  ok: boolean;
}

type ParseResult<T> = { ok: true; fields: T } | { ok: false; error: FieldError };

interface TemplateFields {
  name: string;
  category: BlockCategory;
  defaultDurationMin: number;
  expectedOutcome: string;
  firstAction: string;
  notes: string | null;
}

function parseTemplateFields(formData: FormData): ParseResult<TemplateFields> {
  const name = requiredText(formData.get("name"), LIMITS.name);
  if (!name.ok) return { ok: false, error: name.error };
  const cat = category(formData.get("category"));
  if (!cat.ok) return { ok: false, error: cat.error };
  const duration = durationMinutes(formData.get("defaultDurationMin"));
  if (!duration.ok) return { ok: false, error: duration.error };
  const outcome = requiredText(formData.get("expectedOutcome"), LIMITS.outcome);
  if (!outcome.ok) return { ok: false, error: outcome.error };
  const firstAction = requiredText(formData.get("firstAction"), LIMITS.firstAction);
  if (!firstAction.ok) return { ok: false, error: firstAction.error };
  const notes = optionalText(formData.get("notes"), LIMITS.notes);
  if (!notes.ok) return { ok: false, error: notes.error };

  return {
    ok: true,
    fields: {
      name: name.value,
      category: cat.value,
      defaultDurationMin: duration.value,
      expectedOutcome: outcome.value,
      firstAction: firstAction.value,
      notes: notes.value,
    },
  };
}

export async function createTemplate(
  _prev: TemplateFormState,
  formData: FormData,
): Promise<TemplateFormState> {
  await requireUser();
  const parsed = parseTemplateFields(formData);
  if (!parsed.ok) return { error: parsed.error, ok: false };

  const [row] = await db.insert(blockTemplate).values(parsed.fields).returning();
  await appendEvent(ENTITY.template, row!.id, EVENT.templateCreated, {
    name: row!.name,
    category: row!.category,
  });
  revalidatePath("/library");
  return { error: null, ok: true };
}

export async function updateTemplate(
  _prev: TemplateFormState,
  formData: FormData,
): Promise<TemplateFormState> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const parsed = parseTemplateFields(formData);
  if (!parsed.ok) return { error: parsed.error, ok: false };

  await db.update(blockTemplate).set(parsed.fields).where(eq(blockTemplate.id, id));
  await appendEvent(ENTITY.template, id, EVENT.templateEdited, { name: parsed.fields.name });
  revalidatePath("/library");
  return { error: null, ok: true };
}

// Archive/unarchive are single-purpose toggles (not "delete"): archived
// templates leave the picker but historical blocks that copied them are
// untouched (PRD 02 FR-2).
export async function archiveTemplate(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  await db
    .update(blockTemplate)
    .set({ archivedAt: new Date() })
    .where(eq(blockTemplate.id, id));
  await appendEvent(ENTITY.template, id, EVENT.templateArchived, {});
  revalidatePath("/library");
}

export async function unarchiveTemplate(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  await db.update(blockTemplate).set({ archivedAt: null }).where(eq(blockTemplate.id, id));
  await appendEvent(ENTITY.template, id, EVENT.templateEdited, { unarchived: true });
  revalidatePath("/library");
}

// Hard delete — only for templates never used in any week (no referencing
// blocks). Used templates carry history and must be archived instead (PRD 02
// §3); the guard here makes deleting one a no-op, and the FK is a final safety
// net. The UI only offers delete for unused templates.
export async function deleteTemplate(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const references = await db
    .select({ id: block.id })
    .from(block)
    .where(eq(block.templateId, id))
    .limit(1);
  if (references.length > 0) return; // used — protected; archive instead

  await db.delete(blockTemplate).where(eq(blockTemplate.id, id));
  await appendEvent(ENTITY.template, id, EVENT.templateDeleted, {});
  revalidatePath("/library");
}
