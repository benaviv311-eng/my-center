import type { CandidateExercise, PracticeContext, PracticeIntentInput } from "./types";

export const BASIC_RECEPTION_INTENT: PracticeIntentInput = {
  groupId: null,
  durationSeconds: 5400,
  primaryOutcome: "קבלת סרב יציבה שמאפשרת התקפה",
  focuses: ["reception"],
  style: "regular",
  warmup: { mode: "topic" },
  sourcePolicy: "library-only",
};

export function fixtureContext(overrides: Partial<PracticeContext> = {}): PracticeContext {
  return {
    intent: BASIC_RECEPTION_INTENT,
    group: null,
    exercises: [],
    history: [],
    feedback: [],
    equipment: null,
    courtCount: null,
    ...overrides,
  };
}

export function fixtureExercise(overrides: Partial<CandidateExercise> = {}): CandidateExercise {
  return {
    exerciseId: "00000000-0000-4000-8000-000000000001",
    versionId: "00000000-0000-4000-8000-000000000002",
    versionNumber: 1,
    source: "sheets",
    kind: "technical",
    skillSlugs: ["reception"],
    stage: "fixed",
    metadata: null,
    title: "קבלה למטרה",
    description: "קבלת כדור לאזור מוגדר",
    coachingCues: ["מוקדם לכדור"],
    minLevel: null,
    maxLevel: null,
    ...overrides,
  };
}
