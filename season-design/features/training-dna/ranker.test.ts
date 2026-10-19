import { describe, expect, it } from "vitest";
import { fixtureContext, fixtureExercise } from "./fixtures";
import { rankExercises } from "./ranker";
import type { ArcSlot } from "./types";
const slot: ArcSlot = { role: "decide", focus: "reception", targetSeconds: 600, required: true };

describe("deterministic scoring", () => {
  it("returns identical ranking and scores for identical inputs", () => {
    const a = fixtureExercise({ exerciseId: "a", stage: "complex" });
    const b = fixtureExercise({ exerciseId: "b", stage: "game-situation" });
    const context = fixtureContext({ exercises: [a,b] });
    expect(rankExercises(slot, context, [a,b], [])).toEqual(rankExercises(slot, context, [a,b], []));
  });
  it("penalizes recently repeated material", () => {
    const a = fixtureExercise({ exerciseId: "a" });
    const b = fixtureExercise({ exerciseId: "b" });
    const context = fixtureContext({ history: [{
      id: "last", groupId: null, focuses: ["reception"], exerciseIds: ["a"], createdAt: "2026-10-17",
    }] });
    const ranked = rankExercises(slot, context, [a,b], []);
    expect(ranked.find((r) => r.exercise.exerciseId === "a")!.score)
      .toBeLessThan(ranked.find((r) => r.exercise.exerciseId === "b")!.score);
  });
  it("penalizes the newest practices, not the oldest, in descending history", () => {
    const recent = fixtureExercise({ exerciseId: "recent" });
    const stale = fixtureExercise({ exerciseId: "stale" });
    const history = [
      { id: "newest", groupId: null, focuses: ["reception" as const], exerciseIds: ["recent"], createdAt: "2026-10-19" },
      ...[18, 17, 16].map((day) => ({
        id: String(day), groupId: null, focuses: ["reception" as const],
        exerciseIds: ["different"], createdAt: `2026-10-${day}`,
      })),
      { id: "oldest", groupId: null, focuses: ["reception" as const], exerciseIds: ["stale"], createdAt: "2026-09-01" },
    ];
    const context = fixtureContext({ history });
    const ranked = rankExercises(slot, context, [recent, stale], []);
    expect(ranked.find((r) => r.exercise.exerciseId === "recent")?.penalties.recentRepeat).toBe(15);
    expect(ranked.find((r) => r.exercise.exerciseId === "stale")?.penalties.recentRepeat).toBeUndefined();
  });
});
