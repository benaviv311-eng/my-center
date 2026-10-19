import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PracticeForm } from "./practice-form";
import { fixtureContext } from "./fixtures";
import type { GeneratedPractice, PracticeIntentInput } from "./types";

afterEach(cleanup);

describe("PracticeForm", () => {
  it("sends ordered focuses and locked 24:15 warm-up in exact seconds", async () => {
    const generate = vi.fn(async (_input: PracticeIntentInput) => ({
      ok: false as const, code: "NO_ELIGIBLE_EXERCISES" as const, details: ["אין תרגילים"],
    }));
    render(<PracticeForm groups={[{ id: "00000000-0000-4000-8000-000000000010", name: "U15" }]} generate={generate} />);
    fireEvent.change(screen.getByLabelText("קבוצה"), { target: { value: "00000000-0000-4000-8000-000000000010" } });
    fireEvent.change(screen.getByLabelText("מטרת האימון"), { target: { value: "קבלה יציבה למוסר" } });
    fireEvent.change(screen.getByLabelText("מוקד ראשי"), { target: { value: "reception" } });
    fireEvent.change(screen.getByLabelText("מוקד משני"), { target: { value: "attack" } });
    fireEvent.click(screen.getByRole("button", { name: "בנה אימון" }));
    await waitFor(() => expect(generate).toHaveBeenCalledTimes(1));
    const payload = generate.mock.calls[0][0];
    expect(payload.focuses).toEqual(["reception", "attack"]);
    expect(payload.durationSeconds).toBe(5400);
    expect(payload.warmup.mode).toBe("fixed");
    expect((payload.warmup.fixedBlocks ?? []).reduce((sum: number, block: { seconds: number }) => sum + block.seconds, 0)).toBe(1455);
    expect(screen.getByRole("alert")).toHaveTextContent("אין תרגילים");
  });

  it("previews a returned training arc and its exact duration", async () => {
    const p: GeneratedPractice = {
      id: "training-a",
      intent: fixtureContext().intent,
      blocks: [{
        id: "a", role: "decide", focus: "reception", exercise: null,
        title: "קבלת סרב", seconds: 5400, locked: false,
        rationale: { why: "קבלה", whyNow: "העברה למשחק", watch: "מוקדם לכדור", next: "סיום", evidenceKind: "rule" },
        warnings: [],
      }],
      warnings: [], evidence: [],
    };
    const generate = vi.fn(async (_input: PracticeIntentInput) => ({ ok: true as const, practice: p }));
    render(<PracticeForm groups={[]} generate={generate} />);
    fireEvent.click(screen.getByRole("button", { name: "בנה אימון" }));
    expect(await screen.findByText("העברה למשחק", { exact: false })).toBeInTheDocument();
    expect(screen.getAllByText("90:00").length).toBeGreaterThan(0);
  });
});
