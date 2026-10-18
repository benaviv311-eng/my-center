import type { SkillLevel, SkillSlug } from "@/features/groups/types";

export const EXERCISE_SOURCES = ["sheets", "user", "generated"] as const;
export type ExerciseSource = (typeof EXERCISE_SOURCES)[number];

export const PROGRESSION_STAGES = [
  "isolated",
  "fixed",
  "complex",
  "game-situation",
] as const;
export type ProgressionStage = (typeof PROGRESSION_STAGES)[number];

export const EXERCISE_KINDS = [
  "technical",
  "warm-up-game",
  "group-game",
  "competitive-game",
  "game-flow-sequence",
  "transition-idea",
  "warmup-idea",
  "coaching-tag",
] as const;
export type ExerciseKind = (typeof EXERCISE_KINDS)[number];

export interface Exercise {
  id: string;
  ownerId: string | null;
  source: ExerciseSource;
  kind: ExerciseKind;
  skillId: string | null;
  skillSlug?: SkillSlug | null;
  title: string;
  progressionStage: ProgressionStage | null;
  minLevel: SkillLevel | null;
  maxLevel: SkillLevel | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  sourceSpreadsheetId: string | null;
  sourceTab: string | null;
  sourceRow: number | null;
  sourceKey: string | null;
  sourceHash: string | null;
  normalizedSignature: string | null;
  currentVersionNumber: number;
  synchronizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseVersion {
  id: string;
  exerciseId: string;
  versionNumber: number;
  title: string;
  description: string;
  setup: string;
  flow: string;
  rules: string;
  coachingCues: string;
  variations: string;
  contentHash: string;
  sourceSnapshot: Record<string, unknown>;
  planningMetadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ExerciseTag {
  id: string;
  ownerId: string | null;
  slug: string;
  labelHe: string;
  createdAt: string;
}

export type SheetSyncStatus = "running" | "succeeded" | "failed";

export interface SheetSyncRun {
  id: string;
  spreadsheetId: string;
  status: SheetSyncStatus;
  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  failedCount: number;
  errorSummary: string | null;
  startedAt: string;
  finishedAt: string | null;
}
