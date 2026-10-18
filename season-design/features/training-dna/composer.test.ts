import { describe, expect, it } from "vitest";
import { composePractice } from "./composer";
import { fixtureContext, fixtureExercise } from "./fixtures";
import type { RankedExercise } from "./ranker";
import { buildTrainingArc } from "./arc";

describe("exact practice duration", () => {
  it("preserves a 24:15 locked warm-up inside 90:00 exactly", () => {
    const fixed = { id: "fixed", title: "חימום 1", role: "prepare" as const, seconds: 1455,
      coachingCues: [], locked: true as const };
    const context = fixtureContext({
      intent: { ...fixtureContext().intent, warmup: { mode: "fixed", fixedBlocks: [fixed] } },
    });
    const slots = buildTrainingArc(context.intent, null, []);
    const exercise = fixtureExercise();
    const ranked: RankedExercise = { exercise, score: 10,
      dimensions: { goal: 5, progression: 3, density: 3, transfer: 3, flow: 3 }, penalties: {} };
    const result = composePractice(context, slots, slots.map(() => [ranked]));
    expect(result).not.toHaveProperty("ok", false);
    if ("code" in result) throw new Error("Expected an exact-duration practice");
    expect(result.blocks[0].seconds).toBe(1455);
    expect(result.blocks[0].locked).toBe(true);
    expect(result.blocks.reduce((sum, b) => sum + b.seconds, 0)).toBe(5400);
  });
  it("returns a typed failure if required slots have no eligible drill", () => {
    const context = fixtureContext();
    const slots = buildTrainingArc(context.intent, null, []);
    expect(composePractice(context, slots, slots.map(() => []))).toMatchObject({
      ok: false, code: "NO_ELIGIBLE_EXERCISES",
    });
  });
});
