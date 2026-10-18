import { describe, expect, it } from "vitest";
import { filterEligible } from "./eligibility";
import { fixtureContext, fixtureExercise } from "./fixtures";
import type { ArcSlot } from "./types";

const slot: ArcSlot = { role: "stabilize", focus: "reception", targetSeconds: 600, required: true };

describe("hard exercise eligibility", () => {
  it("rejects a known six-player cap for an 18-player team", () => {
    const exercise = fixtureExercise({ maxPlayers: 6 });
    const context = fixtureContext({ group: {
      id: "g", name: "Team", playerCount: 18, generalLevel: "basic",
      approvedLevels: {}, ageCategory: "high_school", equipment: null, courtCount: null,
    }, exercises: [exercise] });
    expect(filterEligible(slot, context).candidates).toEqual([]);
  });
  it("allows unknown capacity but surfaces uncertainty", () => {
    const context = fixtureContext({ exercises: [fixtureExercise({ maxPlayers: null })] });
    const result = filterEligible(slot, context);
    expect(result.candidates).toHaveLength(1);
    expect(result.warnings.some((x) => x.code === "UNKNOWN_CAPACITY")).toBe(true);
  });
  it("enforces library-only even when a generated exercise matches", () => {
    const context = fixtureContext({ exercises: [fixtureExercise({ source: "generated" })] });
    expect(filterEligible(slot, context).candidates).toHaveLength(0);
  });
});
