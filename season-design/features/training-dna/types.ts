import type { SkillLevel, SkillSlug } from "@/features/groups/types";
import type { ExerciseKind, ExerciseSource, ProgressionStage } from "@/features/library/types";

export const ARC_ROLES = ["prepare", "solve", "stabilize", "decide", "compete"] as const;
export type ArcRole = (typeof ARC_ROLES)[number];

export const PRACTICE_STYLES = ["regular", "technical", "game-based", "advanced", "competitive", "light"] as const;
export type PracticeStyle = (typeof PRACTICE_STYLES)[number];

export const SOURCE_POLICIES = ["library-only", "prefer-library", "free-generation"] as const;
export type SourcePolicy = (typeof SOURCE_POLICIES)[number];

export interface FixedWarmupBlock {
  id: string;
  title: string;
  role: "prepare";
  seconds: number;
  locked: true;
  coachingCues: string[];
}

export interface PracticeIntentInput {
  groupId: string | null;
  durationSeconds: number;
  primaryOutcome: string;
  focuses: SkillSlug[];
  style: PracticeStyle;
  warmup: { mode: "topic" | "fixed" | "game" | "auto"; fixedBlocks?: FixedWarmupBlock[] };
  sourcePolicy: SourcePolicy;
  constraints?: string;
  allowNoGameTransfer?: boolean;
}

export interface PlanningMetadata {
  roles: ArcRole[];
  minPlayers: number | null;
  maxPlayers: number | null;
  minSeconds: number | null;
  maxSeconds: number | null;
  equipment: string[] | null;
  loads: { physical: number | null; cognitive: number | null; technical: number | null };
  density: number | null;
  transfer: number | null;
  setupComplexity: number | null;
  familyKey: string | null;
  regressions: string[];
  progressions: string[];
}

export interface CandidateExercise {
  exerciseId: string;
  versionId: string;
  versionNumber: number;
  source: ExerciseSource;
  kind: ExerciseKind;
  skillSlugs: SkillSlug[];
  stage: ProgressionStage | null;
  metadata: PlanningMetadata | null;
  title: string;
  description: string;
  coachingCues: string[];
  minLevel: SkillLevel | null;
  maxLevel: SkillLevel | null;
}

export interface FocusEvidence {
  id: string;
  focus: SkillSlug;
  score: number | null;
  note: string;
  createdAt: string;
  kind: "coach-reported" | "system-inferred";
}

export interface PracticeEvidence {
  id: string;
  groupId: string | null;
  exerciseIds: string[];
  focuses: SkillSlug[];
  createdAt: string;
}

export interface GroupPlanningSnapshot {
  id: string;
  name: string;
  playerCount: number;
  generalLevel: SkillLevel;
  approvedLevels: Partial<Record<SkillSlug, SkillLevel>>;
  ageCategory: string;
  equipment: string[] | null;
  courtCount: number | null;
}

export interface PracticeContext {
  intent: PracticeIntentInput;
  group: GroupPlanningSnapshot | null;
  exercises: CandidateExercise[];
  history: PracticeEvidence[];
  feedback: FocusEvidence[];
  equipment: string[] | null;
  courtCount: number | null;
}

export interface ProblemEvidence {
  id: string;
  focus: SkillSlug;
  problem: string;
  kind: "coach-reported" | "system-inferred";
  confidence: "low" | "medium" | "high";
}

export interface ArcSlot {
  role: ArcRole;
  focus: SkillSlug;
  targetSeconds: number;
  required: boolean;
}

export interface PracticeBlock {
  id: string;
  role: ArcRole;
  focus: SkillSlug;
  exercise: CandidateExercise | null;
  title: string;
  seconds: number;
  locked: boolean;
  rationale: {
    why: string;
    whyNow: string;
    watch: string;
    next: string;
    evidenceKind: "fact" | "inference" | "rule";
  };
  warnings: string[];
}

export interface ValidationIssue {
  code: string;
  message: string;
}

export interface GeneratedPractice {
  id: string;
  intent: PracticeIntentInput;
  blocks: PracticeBlock[];
  warnings: ValidationIssue[];
  evidence: PracticeEvidence[];
}

export type CompositionFailure = {
  ok: false;
  code: "NO_ELIGIBLE_EXERCISES" | "DURATION_IMPOSSIBLE" | "VALIDATION_FAILED";
  details: string[];
};
