import { describe, expect, it } from "vitest";
import type { Exercise, ExerciseVersion } from "@/features/library/types";
import { toCandidateExercise } from "./library-adapter";

const exercise = {
  id: "00000000-0000-4000-8000-000000000011",
  source: "sheets",
  kind: "technical",
  skillSlug: "reception",
  progressionStage: "game-situation",
  minLevel: "basic",
  maxLevel: "advanced",
} as Exercise;

const version = {
  id: "00000000-0000-4000-8000-000000000012",
  exerciseId: exercise.id,
  versionNumber: 3,
  title: "קבלה חיה",
  description: "קבלה למוסר",
  coachingCues: "מוקדם לכדור\nפלטפורמה למטרה",
} as ExerciseVersion;

describe("versioned exercise adapter", () => {
  it("keeps Hebrew and canonical source/version identity", () => {
    const candidate = toCandidateExercise(exercise, version);
    expect(candidate.title).toBe("קבלה חיה");
    expect(candidate.coachingCues).toEqual(["מוקדם לכדור", "פלטפורמה למטרה"]);
    expect(candidate.skillSlugs).toEqual(["reception"]);
    expect(candidate.stage).toBe("game-situation");
    expect(candidate.versionNumber).toBe(3);
    expect(candidate.source).toBe("sheets");
    expect(candidate.metadata).toBeNull();
  });

  it("fills only unknown planning fields with null", () => {
    const candidate = toCandidateExercise(exercise, {
      ...version,
      planningMetadata: { roles: ["decide"], minPlayers: 4, maxPlayers: 6, loads: { physical: 2 } },
    });
    expect(candidate.metadata?.roles).toEqual(["decide"]);
    expect(candidate.metadata?.loads.physical).toBe(2);
    expect(candidate.metadata?.loads.cognitive).toBeNull();
    expect(candidate.metadata?.transfer).toBeNull();
  });

  it("rejects corrupted planning metadata rather than treating it as measured", () => {
    expect(() => toCandidateExercise(exercise, {
      ...version,
      planningMetadata: { loads: { physical: 7 } },
    })).toThrow();
  });
});
