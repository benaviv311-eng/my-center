import { describe, expect, it } from "vitest";
import { BASIC_RECEPTION_INTENT, fixtureExercise } from "./fixtures";
import type { GeneratedPractice } from "./types";
import { interpretFeedback, type PracticeFeedback } from "./feedback";

const exercise = fixtureExercise();
const practice: GeneratedPractice = {
  id: "practice-1",
  intent: BASIC_RECEPTION_INTENT,
  evidence: [],
  warnings: [],
  blocks: [{
    id: "block-1", role: "decide", focus: "reception", title: exercise.title,
    exercise, seconds: 5400, locked: false, warnings: [],
    rationale: { why: "קבלה", whyNow: "אחרי תנועה", watch: "הגעה מאוזנת",
      next: "משחק", evidenceKind: "rule" },
  }],
};
function feedback(patch: Partial<PracticeFeedback> = {}): PracticeFeedback {
  return {
    practiceId: practice.id,
    completedBlockIds: ["block-1"],
    skippedBlockIds: [],
    focusRatings: { reception: 2 },
    difficulty: "appropriate",
    usefulExerciseIds: [],
    difficultExerciseIds: [],
    problemCategory: "short-serve",
    note: "מאחרות לכדור קצר",
    ...patch,
  };
}

describe("future-only post-practice feedback", () => {
  it("proposes reception reinforcement with evidence references", () => {
    const result = interpretFeedback(feedback(), practice);
    expect(result.evidence.some((item) => item.focus === "reception" && item.score === 2)).toBe(true);
    expect(result.recommendations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        targetFocus: "reception", action: "reinforce", status: "proposed",
        evidenceIds: [expect.any(String)],
      }),
    ]));
  });
  it("does not turn one high rating into a permanent level change", () => {
    const result = interpretFeedback(feedback({
      focusRatings: { reception: 5 }, note: "", problemCategory: null,
    }), practice);
    expect(result.recommendations.some((item) => item.action === "progress")).toBe(false);
    expect(result).not.toHaveProperty("approvedLevels");
  });
  it("suggests a light session after a difficult jump-heavy practice", () => {
    const result = interpretFeedback(feedback({
      difficulty: "too-hard", note: "יותר מדי קפיצות", problemCategory: null,
    }), practice);
    expect(result.recommendations.some((item) => item.action === "reduce-load")).toBe(true);
  });
  it("does not invent a problem category from an empty note", () => {
    const result = interpretFeedback(feedback({ note: "", problemCategory: null }), practice);
    expect(result.evidence.every((item) => item.note === "")).toBe(true);
  });
});
