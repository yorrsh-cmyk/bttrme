"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { ENTITY, EVENT, appendEvent } from "@/db/events";
import { block, blockTemplate, weeklyGoal } from "@/db/schema";
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

export interface PlanningFormState {
  error: FieldError | null;
  ok: boolean;
}

const OK: PlanningFormState = { error: null, ok: true };

// --- Goals: three always-present slots, saved together (PRD 02 FR-4) ---------

export async function saveGoals(
  _prev: PlanningFormState,
  formData: FormData,
): Promise<PlanningFormState> {
  await requireUser();
  const weekId = String(formData.get("weekId") ?? "");
  if (!weekId) return { error: "required", ok: false };

  const existing = await db
    .select()
    .from(weeklyGoal)
    .where(eq(weeklyGoal.weekId, weekId));
  const byPosition = new Map(existing.map((g) => [g.position, g]));

  for (let position = 1; position <= 3; position++) {
    const raw = formData.get(`goal_${position}`);
    const text = typeof raw === "string" ? raw.trim() : "";
    if (text.length > LIMITS.goal) return { error: "too_long", ok: false };

    const current = byPosition.get(position);

    if (text.length === 0) {
      if (current) {
        await db.delete(weeklyGoal).where(eq(weeklyGoal.id, current.id));
        await appendEvent(ENTITY.goal, current.id, EVENT.goalCleared, { position });
      }
      continue;
    }

    if (!current) {
      const [row] = await db
        .insert(weeklyGoal)
        .values({ weekId, position, text })
        .returning();
      await appendEvent(ENTITY.goal, row!.id, EVENT.goalSet, { position, text });
    } else if (current.text !== text) {
      await db
        .update(weeklyGoal)
        .set({ text, updatedAt: new Date() })
        .where(eq(weeklyGoal.id, current.id));
      await appendEvent(ENTITY.goal, current.id, EVENT.goalEdited, { position, text });
    }
  }

  revalidatePath("/week");
  return OK;
}

// --- Pool blocks -------------------------------------------------------------

export async function addBlockFromTemplate(weekId: string, templateId: string): Promise<void> {
  await requireUser();
  if (!weekId || !templateId) return;

  const [tpl] = await db
    .select()
    .from(blockTemplate)
    .where(eq(blockTemplate.id, templateId))
    .limit(1);
  if (!tpl) return;

  // Template fields are COPIED — the block is a historical fact, immune to
  // later template edits (PRD 02 FR-5).
  const [row] = await db
    .insert(block)
    .values({
      weekId,
      templateId: tpl.id,
      name: tpl.name,
      category: tpl.category,
      durationMin: tpl.defaultDurationMin,
      expectedOutcome: tpl.expectedOutcome,
      firstAction: tpl.firstAction,
      notes: tpl.notes,
      status: "pool",
    })
    .returning();
  await appendEvent(ENTITY.block, row!.id, EVENT.blockAddedToPool, {
    weekId,
    templateId: tpl.id,
    name: tpl.name,
    category: tpl.category,
  });
  revalidatePath("/week");
}

interface BlockFields {
  name: string;
  category: BlockCategory;
  durationMin: number;
  expectedOutcome: string;
  firstAction: string;
  notes: string | null;
}

type ParseResult =
  | { ok: true; fields: BlockFields }
  | { ok: false; error: FieldError };

function parseBlockFields(formData: FormData): ParseResult {
  const name = requiredText(formData.get("name"), LIMITS.name);
  if (!name.ok) return { ok: false, error: name.error };
  const cat = category(formData.get("category"));
  if (!cat.ok) return { ok: false, error: cat.error };
  const duration = durationMinutes(formData.get("durationMin"));
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
      durationMin: duration.value,
      expectedOutcome: outcome.value,
      firstAction: firstAction.value,
      notes: notes.value,
    },
  };
}

export async function addOneOffBlock(
  _prev: PlanningFormState,
  formData: FormData,
): Promise<PlanningFormState> {
  await requireUser();
  const weekId = String(formData.get("weekId") ?? "");
  if (!weekId) return { error: "required", ok: false };
  const parsed = parseBlockFields(formData);
  if (!parsed.ok) return { error: parsed.error, ok: false };

  const [row] = await db
    .insert(block)
    .values({ weekId, templateId: null, status: "pool", ...parsed.fields })
    .returning();
  await appendEvent(ENTITY.block, row!.id, EVENT.blockAddedToPool, {
    weekId,
    oneOff: true,
    name: parsed.fields.name,
    category: parsed.fields.category,
  });
  revalidatePath("/week");
  return OK;
}

export async function updateBlock(
  _prev: PlanningFormState,
  formData: FormData,
): Promise<PlanningFormState> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "required", ok: false };
  const parsed = parseBlockFields(formData);
  if (!parsed.ok) return { error: parsed.error, ok: false };

  await db.update(block).set(parsed.fields).where(eq(block.id, id));
  await appendEvent(ENTITY.block, id, EVENT.blockEdited, { name: parsed.fields.name });
  revalidatePath("/week");
  return OK;
}

export async function removeBlock(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  // A removed block is hidden from the pool but kept in history; the event is
  // queryable (PRD 02 §10). Only pool blocks can be removed this way.
  await db
    .update(block)
    .set({ status: "removed" })
    .where(and(eq(block.id, id), eq(block.status, "pool")));
  await appendEvent(ENTITY.block, id, EVENT.blockRemoved, {});
  revalidatePath("/week");
}
