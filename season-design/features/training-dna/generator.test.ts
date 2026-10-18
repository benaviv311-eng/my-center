import { describe, expect, it } from "vitest";
import { fixtureContext, fixtureExercise } from "./fixtures";
import { generatePractice } from "./generator";

describe("Training DNA generator", () => {
  it("returns typed failure instead of fabricated material under library-only", () => {
    expect(generatePractice(fixtureContext())).toMatchObject({
      ok: false, code: "NO_ELIGIBLE_EXERCISES",
    });
  });
  it("is reproducible with no AI and with no group history", () => {
    const exercise = fixtureExercise({ stage: "game-situation",
      metadata: { roles: ["prepare","solve","stabilize","decide","compete"],
        minPlayers: null,maxPlayers:null,minSeconds:null,maxSeconds:null,equipment:null,
        loads:{physical:null,cognitive:null,technical:null},density:null,transfer:4,
        setupComplexity:null,familyKey:null,regressions:[],progressions:[] } });
    const context = fixtureContext({ exercises: [exercise] });
    const a = generatePractice(context);
    const b = generatePractice(context);
    expect(a).toEqual(b);
    expect(a.ok).toBe(true);
    if (a.ok) {
      expect(a.practice.blocks.reduce((n,x)=>n+x.seconds,0)).toBe(5400);
      expect(a.practice.blocks.some((x)=>x.role==="compete")).toBe(true);
    }
  });
});
