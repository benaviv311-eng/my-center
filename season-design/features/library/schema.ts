import { z } from "zod";
import { CANONICAL_SKILLS, SKILL_LEVELS } from "../groups/types";
import {
  EXERCISE_KINDS,
  EXERCISE_SOURCES,
  PROGRESSION_STAGES,
} from "./types";

export const exerciseSourceSchema = z.enum(EXERCISE_SOURCES);
export const exerciseKindSchema = z.enum(EXERCISE_KINDS);
export const progressionStageSchema = z.enum(PROGRESSION_STAGES);
export const skillSlugSchema = z.enum(
  CANONICAL_SKILLS.map((skill) => skill.slug) as [
    (typeof CANONICAL_SKILLS)[number]["slug"],
    ...(typeof CANONICAL_SKILLS)[number]["slug"][],
  ],
);

export const exerciseVersionContentSchema = z
  .object({
    title: z.string().trim().min(1),
    description: z.string().default(""),
    objective: z.string().optional(),
    setup: z.string().optional(),
    flow: z.string().optional(),
    rules: z.array(z.string()).optional(),
    coachingCues: z.array(z.string()).optional(),
    variations: z.array(z.string()).optional(),
    level: z.enum(SKILL_LEVELS).optional(),
    minPlayers: z.number().int().positive().optional(),
    maxPlayers: z.number().int().positive().optional(),
    durationMinutes: z.number().positive().optional(),
  })
  .passthrough();

export const personalExerciseInputSchema = z
  .object({
    source: z.enum(["user", "generated"]),
    kind: exerciseKindSchema,
    progressionStage: progressionStageSchema.nullable().default(null),
    skillSlug: skillSlugSchema.nullable().default(null),
    title: z.string().trim().min(1).max(160),
    content: exerciseVersionContentSchema,
  })
  .superRefine((value, context) => {
    if (value.kind === "technical" && value.progressionStage === null) {
      context.addIssue({
        code: "custom",
        path: ["progressionStage"],
        message: "Technical exercises require a progression stage",
      });
    }
  });

export type PersonalExerciseInput = z.infer<typeof personalExerciseInputSchema>;
