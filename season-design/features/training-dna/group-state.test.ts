import { describe, expect, it } from "vitest";
import type { Group } from "@/features/groups/types";
import { buildGroupState, deriveProblems } from "./group-state";

const group = {
  id: "group-1", name: "U15", typicalPlayerCount: 18, generalLevel: "intermediate",
  ageCategory: "middle_school", recurringConstraints: {},
} as Group;

describe("planning evidence", () => {
  it("converts a low structured rating to evidence even without a typed note", () => {
    const result = deriveProblems([{ id: "low", focus: "reception", score: 2, note: "", createdAt: "2026-10-19", kind: "coach-reported" }]);
    expect(result).toHaveLength(1);
    expect(result[0].problem).toContain("2/5");
    expect(result[0].kind).toBe("coach-reported");
  });
  it("uses approved coach level without invented recent issues", () => {
    const value = buildGroupState(group, { reception: "basic" }, [], []);
    expect(value?.approvedLevels.reception).toBe("basic");
    expect(value?.playerCount).toBe(18);
    expect(deriveProblems([])).toEqual([]);
  });
  it("attributes observed coaching concerns to the source", () => {
    const problems = deriveProblems([{
      id: "feedback-1", focus: "reception", score: 2, note: "מאחרות לכדור קצר",
      createdAt: "2026-10-18", kind: "coach-reported",
    }]);
    expect(problems).toEqual([expect.objectContaining({
      id: "feedback-1", focus: "reception", kind: "coach-reported", problem: "מאחרות לכדור קצר",
    })]);
  });
});
