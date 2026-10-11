import { describe, expect, it } from "vitest";
import { toOfflineGroupSummary } from "./offline-group-snapshot";

describe("offline group summary", () => {
  it("keeps only basic group data and excludes coach notes", () => {
    const summary = toOfflineGroupSummary({
      id: "group-1",
      name: "ז׳ מצוינות",
      ageGradeLabel: "כיתה ז׳",
      typicalPlayerCount: 12,
      generalLevel: "intermediate",
      notes: "מידע פרטי שלא צריך להישמר אופליין",
    });

    expect(summary).toEqual({
      id: "group-1",
      name: "ז׳ מצוינות",
      ageGradeLabel: "כיתה ז׳",
      typicalPlayerCount: 12,
      generalLevel: "intermediate",
    });
    expect(summary).not.toHaveProperty("notes");
  });
});
