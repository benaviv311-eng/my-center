import { describe, expect, it } from "vitest";
import { fixtureContext, fixtureExercise } from "./fixtures";
import type { GeneratedPractice } from "./types";
import { createTrainingRepository, type TrainingDataSource } from "./repository";

const exercise = fixtureExercise();
const practice: GeneratedPractice = {
  id: "draft-1",
  intent: fixtureContext().intent,
  warnings: [],
  evidence: [],
  blocks: [{
    id: "block-1", role: "decide", focus: "reception", title: exercise.title,
    seconds: 5400, exercise, locked: false, warnings: [],
    rationale: { why: "מטרה", whyNow: "התקדמות", watch: "מגע", next: "יישום", evidenceKind: "rule" },
  }],
};

function source(): TrainingDataSource {
  return {
    async createPractice(coachId, value) {
      return { id: "saved-1", coachId, groupId: value.intent.groupId,
        practice: structuredClone(value), revision: 1 };
    },
    async getPractice() { return null; },
    async updatePractice() { return null; },
    async createFeedback() {},
    async listRecommendations() { return []; },
    async updateRecommendationStatus() {},
  };
}

describe("coach-owned training repository", () => {
  it("rejects writes from a disabled coach", async () => {
    const repo = createTrainingRepository(source(), { id: "coach-1", accessStatus: "disabled" });
    await expect(repo.savePractice(practice)).rejects.toThrow("INACTIVE_COACH");
  });
  it("returns a conflict instead of silently overwriting an unexpected revision", async () => {
    const repo = createTrainingRepository(source(), { id: "coach-1", accessStatus: "active" });
    await expect(repo.updatePractice("saved-1", practice, 4)).rejects.toThrow("PRACTICE_CONFLICT");
  });
  it("does not mutate a saved exercise version when the original candidate changes", async () => {
    const repo = createTrainingRepository(source(), { id: "coach-1", accessStatus: "active" });
    const saved = await repo.savePractice(practice);
    exercise.title = "שינוי עתידי";
    expect(saved.practice.blocks[0].exercise?.title).toBe("קבלה למטרה");
  });
});
