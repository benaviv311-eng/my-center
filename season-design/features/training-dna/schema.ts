import { z } from "zod";
import { CANONICAL_SKILLS, SKILL_LEVELS } from "@/features/groups/types";
import { EXERCISE_KINDS, EXERCISE_SOURCES, PROGRESSION_STAGES } from "@/features/library/types";
import { ARC_ROLES, PRACTICE_STYLES, SOURCE_POLICIES } from "./types";
import type { PlanningMetadata, PracticeIntentInput } from "./types";

const slugValues = CANONICAL_SKILLS.map((skill) => skill.slug) as [
  (typeof CANONICAL_SKILLS)[number]["slug"],
  ...(typeof CANONICAL_SKILLS)[number]["slug"][],
];
const positiveInt = z.number().int().positive();
const optionalScore = z.number().min(0).max(5).nullable().default(null);

export const planningMetadataSchema = z.object({
  roles: z.array(z.enum(ARC_ROLES)).default([]),
  minPlayers: positiveInt.nullable().default(null),
  maxPlayers: positiveInt.nullable().default(null),
  minSeconds: positiveInt.nullable().default(null),
  maxSeconds: positiveInt.nullable().default(null),
  equipment: z.array(z.string().min(1)).nullable().default(null),
  loads: z.object({
    physical: optionalScore,
    cognitive: optionalScore,
    technical: optionalScore,
  }).default({ physical: null, cognitive: null, technical: null }),
  density: optionalScore,
  transfer: optionalScore,
  setupComplexity: optionalScore,
  familyKey: z.string().nullable().default(null),
  regressions: z.array(z.string()).default([]),
  progressions: z.array(z.string()).default([]),
}).superRefine((value, ctx) => {
  if (value.minPlayers !== null && value.maxPlayers !== null && value.minPlayers > value.maxPlayers) {
    ctx.addIssue({ code: "custom", message: "Invalid player range", path: ["maxPlayers"] });
  }
  if (value.minSeconds !== null && value.maxSeconds !== null && value.minSeconds > value.maxSeconds) {
    ctx.addIssue({ code: "custom", message: "Invalid duration range", path: ["maxSeconds"] });
  }
});

const fixedBlockSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  role: z.literal("prepare"),
  seconds: positiveInt,
  locked: z.literal(true),
  coachingCues: z.array(z.string()).default([]),
});

export const practiceIntentSchema = z.object({
  groupId: z.string().uuid().nullable(),
  durationSeconds: positiveInt,
  primaryOutcome: z.string().trim().min(1),
  focuses: z.array(z.enum(slugValues)).min(1).max(3),
  style: z.enum(PRACTICE_STYLES),
  warmup: z.object({
    mode: z.enum(["topic", "fixed", "game", "auto"]),
    fixedBlocks: z.array(fixedBlockSchema).optional(),
  }),
  sourcePolicy: z.enum(SOURCE_POLICIES),
  constraints: z.string().optional(),
  allowNoGameTransfer: z.boolean().optional(),
}).superRefine((value, ctx) => {
  if (new Set(value.focuses).size !== value.focuses.length) {
    ctx.addIssue({ code: "custom", path: ["focuses"], message: "Focuses must be unique" });
  }
  if (value.warmup.mode === "fixed" && !value.warmup.fixedBlocks?.length) {
    ctx.addIssue({ code: "custom", path: ["warmup"], message: "Fixed warm-up needs blocks" });
  }
  const fixedTime = value.warmup.mode === "fixed"
    ? (value.warmup.fixedBlocks ?? []).reduce((sum, block) => sum + block.seconds, 0)
    : 0;
  if (fixedTime >= value.durationSeconds) {
    ctx.addIssue({ code: "custom", path: ["durationSeconds"], message: "Warm-up consumes practice" });
  }
});

export const candidateExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  versionId: z.string().uuid(),
  versionNumber: positiveInt,
  source: z.enum(EXERCISE_SOURCES),
  kind: z.enum(EXERCISE_KINDS),
  skillSlugs: z.array(z.enum(slugValues)),
  stage: z.enum(PROGRESSION_STAGES).nullable(),
  metadata: planningMetadataSchema.nullable(),
  title: z.string().min(1),
  description: z.string(),
  coachingCues: z.array(z.string()),
  minLevel: z.enum(SKILL_LEVELS).nullable(),
  maxLevel: z.enum(SKILL_LEVELS).nullable(),
});

export function parsePracticeIntent(value: unknown): PracticeIntentInput {
  return practiceIntentSchema.parse(value) as PracticeIntentInput;
}
export function parsePlanningMetadata(value: unknown): PlanningMetadata {
  return planningMetadataSchema.parse(value) as PlanningMetadata;
}
