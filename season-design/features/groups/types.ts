export const SKILL_LEVELS = [
  "beginner",
  "basic",
  "intermediate",
  "advanced",
  "competitive",
] as const;

export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const AGE_CATEGORIES = [
  "elementary",
  "middle_school",
  "high_school",
  "adults",
] as const;

export type AgeCategory = (typeof AGE_CATEGORIES)[number];

export const CANONICAL_SKILLS = [
  { slug: "forearm_pass", labelHe: "תחתית" },
  { slug: "overhead_setting", labelHe: "עילית" },
  { slug: "serve", labelHe: "הגשה" },
  { slug: "attack", labelHe: "התקפה" },
  { slug: "block", labelHe: "חסימה" },
  { slug: "defense", labelHe: "הגנה" },
  { slug: "reception", labelHe: "קבלה" },
  { slug: "coverage", labelHe: "חיפוי" },
  { slug: "transitions", labelHe: "מעברים" },
] as const;

export type SkillSlug = (typeof CANONICAL_SKILLS)[number]["slug"];

export interface Group {
  id: string;
  coachId: string;
  name: string;
  ageCategory: AgeCategory;
  ageGradeLabel: string;
  typicalPlayerCount: number;
  generalLevel: SkillLevel;
  notes: string;
  recurringConstraints: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GroupSkillLevel {
  groupId: string;
  skillId: string;
  approvedLevel: SkillLevel;
  systemSuggestedLevel: SkillLevel | null;
  suggestionReason: string | null;
  updatedAt: string;
}
