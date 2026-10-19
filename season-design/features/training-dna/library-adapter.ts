import type { SupabaseClient } from "@supabase/supabase-js";
import type { SkillSlug, SkillLevel } from "@/features/groups/types";
import type { Exercise, ExerciseKind, ExerciseSource, ExerciseVersion, ProgressionStage } from "@/features/library/types";
import { parsePlanningMetadata } from "./schema";
import type { CandidateExercise } from "./types";

/** Resolve the immutable version that an eventual practice snapshot must refer to. */
export function toCandidateExercise(exercise: Exercise, version: ExerciseVersion): CandidateExercise {
  if (version.exerciseId !== exercise.id) {
    throw new Error("EXERCISE_VERSION_MISMATCH");
  }
  const metadata = version.planningMetadata == null
    ? null
    : parsePlanningMetadata(version.planningMetadata);
  return {
    exerciseId: exercise.id,
    versionId: version.id,
    versionNumber: version.versionNumber,
    source: exercise.source,
    kind: exercise.kind,
    skillSlugs: !exercise.skillSlug
      ? []
      : exercise.skillSlug === "forearm_pass" && (
          exercise.progressionStage !== "game-situation" ||
          /קבל|סרב|מוסר|פריבול/u.test(version.title + " " + version.description)
        )
        ? ["forearm_pass", "reception"]
        : [exercise.skillSlug],
    stage: exercise.progressionStage,
    metadata,
    minPlayers: metadata?.minPlayers ?? exercise.minPlayers ?? null,
    maxPlayers: metadata?.maxPlayers ?? exercise.maxPlayers ?? null,
    title: version.title,
    description: version.description,
    coachingCues: (version.coachingCues ?? "").split(/\r?\n|;/u).map((cue) => cue.trim()).filter(Boolean),
    minLevel: exercise.minLevel,
    maxLevel: exercise.maxLevel,
  };
}

type DatabaseExercise = {
  id: string; owner_id: string | null; source: ExerciseSource; kind: ExerciseKind;
  skill_id: string | null; skills: { slug: SkillSlug } | null;
  title: string; progression_stage: ProgressionStage | null;
  min_level: SkillLevel | null; max_level: SkillLevel | null;
  min_players: number | null; max_players: number | null;
  source_spreadsheet_id: string | null; source_tab: string | null;
  source_row: number | null; source_key: string | null; source_hash: string | null;
  normalized_signature: string | null; current_version_number: number;
  synchronized_at: string | null; created_at: string; updated_at: string;
  exercise_versions: Array<{
    id: string; exercise_id: string; version_number: number;
    title: string; description: string; setup: string; flow: string;
    rules: string; coaching_cues: string; variations: string;
    content_hash: string; source_snapshot: Record<string, unknown>;
    planning_metadata: Record<string, unknown> | null; created_at: string;
  }>;
};

/** Uses the authenticated coach's Supabase client; database RLS is authoritative. */
export async function loadVisibleCandidates(client: SupabaseClient): Promise<CandidateExercise[]> {
  const { data, error } = await client
    .from("exercises")
    .select("*, skills(slug), exercise_versions(*)");
  if (error) throw error;
  return ((data ?? []) as unknown as DatabaseExercise[]).flatMap((record) => {
    const selected = record.exercise_versions.find((version) =>
      version.version_number === record.current_version_number);
    if (!selected) return [];

    const exercise: Exercise = {
      id: record.id,
      ownerId: record.owner_id,
      source: record.source,
      kind: record.kind,
      skillId: record.skill_id,
      skillSlug: record.skills?.slug ?? null,
      title: record.title,
      progressionStage: record.progression_stage,
      minLevel: record.min_level,
      maxLevel: record.max_level,
      minPlayers: record.min_players,
      maxPlayers: record.max_players,
      sourceSpreadsheetId: record.source_spreadsheet_id,
      sourceTab: record.source_tab,
      sourceRow: record.source_row,
      sourceKey: record.source_key,
      sourceHash: record.source_hash,
      normalizedSignature: record.normalized_signature,
      currentVersionNumber: record.current_version_number,
      synchronizedAt: record.synchronized_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
    const version: ExerciseVersion = {
      id: selected.id,
      exerciseId: selected.exercise_id,
      versionNumber: selected.version_number,
      title: selected.title,
      description: selected.description,
      setup: selected.setup,
      flow: selected.flow,
      rules: selected.rules,
      coachingCues: selected.coaching_cues,
      variations: selected.variations,
      contentHash: selected.content_hash,
      sourceSnapshot: selected.source_snapshot,
      planningMetadata: selected.planning_metadata,
      createdAt: selected.created_at,
    };
    const candidate = toCandidateExercise(exercise, version);
    // Existing exercise-level player bounds remain authoritative if version metadata is sparse.
    if (candidate.metadata) {
      candidate.metadata.minPlayers ??= record.min_players;
      candidate.metadata.maxPlayers ??= record.max_players;
    }
    return [candidate];
  });
}
