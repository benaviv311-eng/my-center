import { describe, expect, it } from "vitest";
import { fixtureContext, fixtureExercise } from "./fixtures";
import { validatePractice } from "./validator";
import type { GeneratedPractice } from "./types";

const context = fixtureContext();
const candidate = fixtureExercise();
function practice(): GeneratedPractice {
  return { id: "x", intent: context.intent, evidence: [], warnings: [], blocks: [{
    id: "b", focus: "reception", role: "stabilize", title: candidate.title,
    seconds: 5400, exercise: candidate, locked: false, warnings: [],
    rationale: { why: "", whyNow: "", watch: "", next: "", evidenceKind: "rule" },
  }] };
}

describe("practice validation", () => {
  it("rejects absent real-game decisions unless explicitly overridden", () => {
    expect(validatePractice(practice(), context).errors.some((x) => x.code === "GAME_TRANSFER_REQUIRED")).toBe(true);
  });
  it("treats coach override as warning rather than error", () => {
    const input = { ...context, intent: { ...context.intent, allowNoGameTransfer: true } };
    const result = validatePractice(practice(), input);
    expect(result.errors.some((x) => x.code === "GAME_TRANSFER_REQUIRED")).toBe(false);
    expect(result.warnings.some((x) => x.code === "GAME_TRANSFER_OVERRIDE")).toBe(true);
  });
  it("rejects invalid total seconds", () => {
    const p = practice(); p.blocks[0].seconds = 5399;
    expect(validatePractice(p, context).errors.some((x) => x.code === "DURATION_MISMATCH")).toBe(true);
  });
});
