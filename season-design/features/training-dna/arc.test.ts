import { describe, expect, it } from "vitest";
import { buildTrainingArc } from "./arc";
import { BASIC_RECEPTION_INTENT } from "./fixtures";
import type { GroupPlanningSnapshot } from "./types";

const advanced: GroupPlanningSnapshot = {
  id: "group", name: "Women", playerCount: 12, generalLevel: "advanced",
  approvedLevels: { transitions: "advanced" }, ageCategory: "adults",
  equipment: null, courtCount: null,
};

describe("Training Arc", () => {
  it("allocates exact duration with the primary focus dominant", () => {
    const intent = { ...BASIC_RECEPTION_INTENT, durationSeconds: 3600,
      focuses: ["reception", "attack"] as typeof BASIC_RECEPTION_INTENT.focuses };
    const arc = buildTrainingArc(intent, null, []);
    expect(arc.reduce((total, item) => total + item.targetSeconds, 0)).toBe(3600);
    expect(arc.every((slot) => Number.isInteger(slot.targetSeconds) && slot.targetSeconds > 0)).toBe(true);
    const primary = arc.filter((slot) => slot.focus === "reception").reduce((n, s) => n + s.targetSeconds, 0);
    expect(primary).toBeGreaterThanOrEqual(1800);
  });
  it("starts advanced game-based coaching nearer decisions than beginner work", () => {
    const game = buildTrainingArc({
      ...BASIC_RECEPTION_INTENT, durationSeconds: 5400, focuses: ["transitions"],
      style: "game-based",
    }, advanced, []);
    const beginner = buildTrainingArc(BASIC_RECEPTION_INTENT, null, []);
    expect(game.map((s) => s.role)).not.toEqual(beginner.map((s) => s.role));
    expect(game.some((s) => s.role === "compete")).toBe(true);
  });
  it("reserves a locked 24:15 warm-up", () => {
    const intent = {
      ...BASIC_RECEPTION_INTENT,
      warmup: { mode: "fixed" as const, fixedBlocks: [{
        id: "warm", title: "חימום קבוע", role: "prepare" as const,
        seconds: 1455, locked: true as const, coachingCues: [],
      }] },
    };
    expect(buildTrainingArc(intent, null, []).reduce((s,x) => s+x.targetSeconds, 0)).toBe(3945);
  });
});
