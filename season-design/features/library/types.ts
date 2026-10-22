import type { SkillLevel, SkillSlug } from "../groups/types";

export const EXERCISE_SOURCES = ["sheets", "user", "generated"] as const;
export type ExerciseSource = (typeof EXERCISE_SOURCES)[number];

export const EXERCISE_KINDS = [
  "technical",
  "warmup-game",
  "group-game",
  "competitive-game",
  "game-flow-sequence",
  "transition-idea",
  "warmup-idea",
  "coaching-tag",
] as const;
export type ExerciseKind = (typeof EXERCISE_KINDS)[number];

export const PROGRESSION_STAGES = [
  "isolated",
  "fixed",
  "complex",
  "game-situation",
] as const;
export type ProgressionStage = (typeof PROGRESSION_STAGES)[number];

export interface Exercise {
  id: string;
  ownerId: string | null;
  source: ExerciseSource;
  kind: ExerciseKind;
  progressionStage: ProgressionStage | null;
  skillSlug: SkillSlug | null;
  title: string;
  currentVersionNumber: number;
  isShared: boolean;
  sourceSpreadsheetId: string | null;
  sourceTab: string | null;
  sourceRow: number | null;
  sourceKey: string | null;
  sourceHash: string | null;
  normalizedSignature: string | null;
  synchronizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseVersionContent {
  title: string;
  description?: string;
  objective?: string;
  setup?: string;
  flow?: string;
  rules?: string[];
  coachingCues?: string[];
  variations?: string[];
  level?: SkillLevel;
  minPlayers?: number;
  maxPlayers?: number;
  durationMinutes?: number;
  [key: string]: unknown;
}

export interface ExerciseVersion {
  id: string;
  exerciseId: string;
  versionNumber: number;
  contentHash: string;
  title: string;
  description: string;
  content: ExerciseVersionContent;
  createdAt: string;
}
