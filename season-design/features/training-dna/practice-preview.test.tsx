import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { PracticePreview } from "./practice-preview";
import type { GeneratedPractice } from "./types";

afterEach(cleanup);

const practice: GeneratedPractice = {
  id: "p-1",
  intent: {
    groupId: null,
    durationSeconds: 5400,
    primaryOutcome: "קבלת סרב יציבה שמאפשרת התקפה",
    focuses: ["reception"],
    style: "technical",
    warmup: { mode: "topic" },
    sourcePolicy: "prefer-library",
  },
  blocks: [
    {
      id: "warmup",
      role: "prepare",
      focus: "reception",
      exercise: null,
      title: "חימום ממוקד",
      seconds: 1455,
      locked: true,
      rationale: { why: "הכנה לקבלה", whyNow: "לפני תנועה", watch: "יציבה", next: "תרגול", evidenceKind: "rule" },
      warnings: [],
    },
    {
      id: "reception",
      role: "decide",
      focus: "reception",
      exercise: null,
      title: "קבלת סרב מול החלטה",
      seconds: 3945,
      locked: false,
      rationale: { why: "העברה למשחק", whyNow: "לאחר הכנה", watch: "מגע למטרה", next: "סיום", evidenceKind: "rule" },
      warnings: [],
    },
  ],
  warnings: [{ code: "MISSING_EQUIPMENT", message: "מידע ציוד אינו מלא" }],
  evidence: [],
};

describe("PracticePreview", () => {
  it("shows exact 90:00 total and 24:15 warm-up", () => {
    render(<PracticePreview practice={practice} />);
    expect(screen.getByText("90:00")).toBeInTheDocument();
    const warmup = screen.getByTestId("block-warmup");
    expect(within(warmup).getByText("24:15")).toBeInTheDocument();
    expect(within(warmup).getByText("נעול")).toBeInTheDocument();
  });
  it("shows role, rationale and coaching cues rather than only drill titles", () => {
    render(<PracticePreview practice={practice} />);
    const block = screen.getByTestId("block-reception");
    expect(within(block).getByText("החלטה")).toBeInTheDocument();
    expect(within(block).getByText("למה עכשיו: לאחר הכנה")).toBeInTheDocument();
    expect(within(block).getByText("דגש: מגע למטרה")).toBeInTheDocument();
    expect(screen.getByText("מידע ציוד אינו מלא")).toBeInTheDocument();
  });
});
