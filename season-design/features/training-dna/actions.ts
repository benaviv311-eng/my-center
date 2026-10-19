"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { SkillLevel, SkillSlug } from "@/features/groups/types";
import { CANONICAL_SKILLS } from "@/features/groups/types";
import { loadVisibleCandidates } from "./library-adapter";
import { generatePractice, type GenerationResult } from "./generator";
import { practiceIntentSchema } from "./schema";
import { createSupabaseTrainingSource, createTrainingRepository } from "./repository";
import type { FocusEvidence, GroupPlanningSnapshot, PracticeContext, PracticeEvidence, PracticeIntentInput } from "./types";
import type { PracticeFeedback } from "./feedback";

type DbRow = Record<string, unknown>;

async function authorizedContext() {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");
  const client = await getSupabaseServer();
  const { data: profile, error } = await client.from("profiles")
    .select("access_status").eq("id", user.id).maybeSingle();
  if (error || profile?.access_status !== "active") throw new Error("COACH_ACCESS_DISABLED");
  return { user, client };
}

async function loadPracticeContext(
  input: PracticeIntentInput,
  client: Awaited<ReturnType<typeof getSupabaseServer>>,
  coachId: string,
): Promise<PracticeContext> {
  let group: GroupPlanningSnapshot | null = null;
  const history: PracticeEvidence[] = [];
  const feedback: FocusEvidence[] = [];

  if (input.groupId) {
    const { data: row, error: groupError } = await client.from("groups")
      .select("id,name,age_category,typical_player_count,general_level,recurring_constraints")
      .eq("id", input.groupId).eq("coach_id", coachId).maybeSingle();
    if (groupError || !row) throw new Error("GROUP_NOT_FOUND");

    const { data: ratings, error: ratingError } = await client.from("group_skill_levels")
      .select("skill_id,approved_level").eq("group_id", input.groupId);
    if (ratingError) throw ratingError;
    const { data: skills, error: skillError } = await client.from("skills")
      .select("id,slug");
    if (skillError) throw skillError;
    const knownSlugs = new Set<string>(CANONICAL_SKILLS.map((item) => item.slug));
    const skillIds = new Map((skills ?? []).map((s) => [s.id, s.slug]));
    const approvedLevels: GroupPlanningSnapshot["approvedLevels"] = {};
    for (const rating of ratings ?? []) {
      const slug = skillIds.get(rating.skill_id);
      if (slug && knownSlugs.has(slug)) approvedLevels[slug as SkillSlug] = rating.approved_level as SkillLevel;
    }
    const constraints = (row.recurring_constraints ?? {}) as DbRow;
    const equipment = Array.isArray(constraints.equipment)
      ? constraints.equipment.filter((x): x is string => typeof x === "string") : null;
    const courtCount = typeof constraints.courtCount === "number"
      && Number.isInteger(constraints.courtCount) && constraints.courtCount > 0
      ? constraints.courtCount : null;

    group = {
      id: row.id,
      name: row.name,
      playerCount: row.typical_player_count,
      generalLevel: row.general_level as SkillLevel,
      approvedLevels,
      ageCategory: row.age_category,
      equipment,
      courtCount,
    };

    const { data: previous, error: practiceError } = await client.from("training_practices")
      .select("id,group_id,intent,blocks,created_at")
      .eq("coach_id", coachId).eq("group_id", input.groupId)
      .order("created_at", { ascending: false }).limit(12);
    if (practiceError) throw practiceError;

    for (const entry of previous ?? []) {
      const intent = entry.intent as PracticeIntentInput;
      const blocks = entry.blocks as Array<{ exercise?: { exerciseId?: string } | null }>;
      history.push({
        id: entry.id,
        groupId: entry.group_id,
        createdAt: entry.created_at,
        focuses: Array.isArray(intent?.focuses) ? intent.focuses : [],
        exerciseIds: Array.isArray(blocks)
          ? blocks.map((b) => b.exercise?.exerciseId).filter((id): id is string => Boolean(id))
          : [],
      });
    }
    if (history.length) {
      const { data: notes, error: noteError } = await client.from("training_feedback")
        .select("id,practice_id,payload,created_at")
        .eq("coach_id", coachId).in("practice_id", history.map((h) => h.id));
      if (noteError) throw noteError;
      for (const note of notes ?? []) {
        const payload = note.payload as DbRow;
        const ratings = (payload.focusRatings ?? {}) as Record<string, unknown>;
        for (const [slug, score] of Object.entries(ratings)) {
          if (!knownSlugs.has(slug) || typeof score !== "number" || score < 1 || score > 5) continue;
          feedback.push({
            id: `${note.id}:${slug}`,
            focus: slug as SkillSlug,
            score,
            note: typeof payload.note === "string" ? payload.note : "",
            createdAt: note.created_at,
            kind: "coach-reported",
          });
        }
      }
    }
  }

  return {
    intent: input,
    group,
    exercises: await loadVisibleCandidates(client),
    history,
    feedback,
    equipment: group?.equipment ?? null,
    courtCount: group?.courtCount ?? null,
  };
}

/** Returns a practice proposal; no write occurs until the coach saves. */
export async function createPracticePreviewAction(input: PracticeIntentInput): Promise<GenerationResult> {
  const parsed = practiceIntentSchema.parse(input);
  const { user, client } = await authorizedContext();
  return generatePractice(await loadPracticeContext(parsed, client, user.id));
}

/** Regenerates from server-owned facts before persisting; never trusts client-supplied blocks. */
export async function saveNewPracticeAction(input: PracticeIntentInput): Promise<{ id: string }> {
  const parsed = practiceIntentSchema.parse(input);
  const { user, client } = await authorizedContext();
  const generated = generatePractice(await loadPracticeContext(parsed, client, user.id));
  if (!generated.ok) throw new Error(generated.code);
  const repo = createTrainingRepository(createSupabaseTrainingSource(client),
    { id: user.id, accessStatus: "active" });
  const stored = await repo.savePractice(generated.practice);
  revalidatePath("/practices");
  return { id: stored.id };
}

export async function getSavedTrainingPracticeAction(practiceId: string) {
  const id = z.string().uuid().parse(practiceId);
  const { user, client } = await authorizedContext();
  return createTrainingRepository(createSupabaseTrainingSource(client),
    { id: user.id, accessStatus: "active" }).getPractice(id);
}

export async function submitTrainingFeedbackAction(feedback: PracticeFeedback) {
  const input = z.object({
    practiceId: z.string().uuid(),
    completedBlockIds: z.array(z.string()),
    skippedBlockIds: z.array(z.string()),
    focusRatings: z.record(z.string(), z.number().int().min(1).max(5)),
    difficulty: z.enum(["too-easy", "appropriate", "too-hard"]),
    usefulExerciseIds: z.array(z.string()),
    difficultExerciseIds: z.array(z.string()),
    problemCategory: z.string().nullable(),
    note: z.string().max(4000),
  }).parse(feedback) as PracticeFeedback;
  const { user, client } = await authorizedContext();
  const repository = createTrainingRepository(createSupabaseTrainingSource(client),
    { id: user.id, accessStatus: "active" });
  const result = await repository.submitFeedback(input);
  revalidatePath(`/practices/${input.practiceId}`);
  return result;
}
