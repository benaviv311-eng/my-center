import { z } from "zod";
import { SKILL_LEVELS } from "@/features/groups/types";
import {
  EXERCISE_KINDS,
  EXERCISE_SOURCES,
  PROGRESSION_STAGES,
} from "./types";

export const exerciseSourceSchema = z.enum(EXERCISE_SOURCES);
export const exerciseKindSchema = z.enum(EXERCISE_KINDS);
export const progressionStageSchema = z.enum(PROGRESSION_STAGES);
export const optionalSkillLevelSchema = z.enum(SKILL_LEVELS).nullable();

export const exerciseInputSchema = z
  .object({
    source: exerciseSourceSchema,
    kind: exerciseKindSchema,
    skillId: z.string().uuid().nullable().default(null),
    title: z.string().trim().min(1).max(160),
    progressionStage: progressionStageSchema.nullable().default(null),
    minLevel: optionalSkillLevelSchema.default(null),
    maxLevel: optionalSkillLevelSchema.default(null),
    minPlayers: z.number().int().positive().nullable().default(null),
    maxPlayers: z.number().int().positive().nullable().default(null),
  })
  .refine(
    ({ minPlayers, maxPlayers }) =>
      minPlayers === null || maxPlayers === null || minPlayers <= maxPlayers,
    { message: "minPlayers must not exceed maxPlayers", path: ["maxPlayers"] },
  );

export const exerciseVersionInputSchema = z.object({
  exerciseId: z.string().uuid(),
  versionNumber: z.number().int().positive(),
  title: z.string().trim().min(1).max(160),
  description: z.string().default(""),
  setup: z.string().default(""),
  flow: z.string().default(""),
  rules: z.string().default(""),
  coachingCues: z.string().default(""),
  variations: z.string().default(""),
  contentHash: z.string().trim().min(1),
  sourceSnapshot: z.record(z.string(), z.unknown()).default({}),
});

export type ExerciseInput = z.infer<typeof exerciseInputSchema>;
export type ExerciseVersionInput = z.infer<typeof exerciseVersionInputSchema>;
