import { describe, expect, it } from "vitest";
import { planningMetadataSchema, practiceIntentSchema } from "./schema";

const valid = {
  groupId: null,
  durationSeconds: 5400,
  primaryOutcome: "קבלת סרב שמאפשרת התקפה",
  focuses: ["reception", "attack"],
  style: "technical",
  warmup: { mode: "topic" },
  sourcePolicy: "library-only",
};

describe("Training DNA input contracts", () => {
  it("accepts an exact 90-minute request and preserves ordered focuses", () => {
    const output = practiceIntentSchema.parse(valid);
    expect(output.durationSeconds).toBe(5400);
    expect(output.focuses).toEqual(["reception", "attack"]);
  });

  it.each([
    { durationSeconds: 0 },
    { durationSeconds: 5400.5 },
    { primaryOutcome: " " },
    { focuses: ["reception", "attack", "serve", "block"] },
    { focuses: ["reception", "reception"] },
  ])("rejects invalid intent %j", (patch) => {
    expect(practiceIntentSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });

  it("keeps absent exercise planning measurements unknown", () => {
    const output = planningMetadataSchema.parse({});
    expect(output.minPlayers).toBeNull();
    expect(output.loads.physical).toBeNull();
    expect(output.density).toBeNull();
  });

  it("rejects impossible or fabricated measurement values", () => {
    expect(planningMetadataSchema.safeParse({ loads: { physical: 6 } }).success).toBe(false);
    expect(planningMetadataSchema.safeParse({ minPlayers: 18, maxPlayers: 6 }).success).toBe(false);
  });
});
