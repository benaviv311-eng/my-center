import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FeedbackForm } from "./feedback-form";
import type { GeneratedPractice } from "./types";

afterEach(cleanup);

const practice: GeneratedPractice = {
  id: "00000000-0000-4000-8000-000000000099",
  intent: {
    groupId: null, durationSeconds: 5400, primaryOutcome: "קבלת סרב",
    focuses: ["reception"], style: "regular", warmup: { mode: "topic" },
    sourcePolicy: "library-only",
  },
  blocks: [
    { id: "one", role: "prepare", focus: "reception", title: "חימום",
      exercise: null, seconds: 600, locked: false,
      rationale: { why: "", whyNow: "", watch: "", next: "", evidenceKind: "rule" }, warnings: [] },
    { id: "two", role: "compete", focus: "reception", title: "מצב משחק",
      exercise: null, seconds: 4800, locked: false,
      rationale: { why: "", whyNow: "", watch: "", next: "", evidenceKind: "rule" }, warnings: [] },
  ],
  evidence: [], warnings: [],
};

describe("FeedbackForm", () => {
  it("records skipped blocks separately and proposes a next-session focus", async () => {
    const submit = vi.fn(async () => ({
      evidence: [],
      recommendations: [{
        groupId: null, targetFocus: "reception" as const, action: "reinforce" as const,
        reason: "להמשיך לתרגל קבלה", evidenceIds: [], confidence: "medium" as const,
        status: "proposed" as const,
      }],
    }));
    render(<FeedbackForm practice={practice} submit={submit} />);
    fireEvent.click(screen.getByLabelText("דילגתי על מצב משחק"));
    fireEvent.change(screen.getByLabelText("ציון קבלה"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "סיים אימון ושמור משוב" }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    const sent = submit.mock.calls[0][0];
    expect(sent.completedBlockIds).toContain("one");
    expect(sent.skippedBlockIds).toEqual(["two"]);
    expect(sent.completedBlockIds).not.toContain("two");
    expect(sent.focusRatings.reception).toBe(2);
    expect(await screen.findByText("להמשיך לתרגל קבלה")).toBeInTheDocument();
  });
});
