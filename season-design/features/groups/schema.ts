import { z } from "zod";
import { AGE_CATEGORIES, SKILL_LEVELS } from "./types";

export const skillLevelSchema = z.enum(SKILL_LEVELS);
export const ageCategorySchema = z.enum(AGE_CATEGORIES);

export const groupInputSchema = z.object({
  name: z.string().trim().min(1, "יש להזין שם קבוצה").max(100),
  ageCategory: ageCategorySchema,
  ageGradeLabel: z.string().trim().max(80).default(""),
  typicalPlayerCount: z.number().int().positive("מספר השחקנים חייב להיות חיובי"),
  generalLevel: skillLevelSchema,
  notes: z.string().trim().max(2000).default(""),
  recurringConstraints: z.record(z.string(), z.unknown()).default({}),
});

export type GroupInput = z.infer<typeof groupInputSchema>;

export const groupSkillLevelInputSchema = z.object({
  groupId: z.string().uuid(),
  skillId: z.string().uuid(),
  level: skillLevelSchema,
});

export type GroupSkillLevelInput = z.infer<typeof groupSkillLevelInputSchema>;
