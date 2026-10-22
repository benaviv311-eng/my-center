import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { additionalBankRows } from "./fixtures/additional-bank";

async function loadParser() {
  expect(existsSync("features/library/sync/additional-parser.ts")).toBe(true);
  const parserPath = "./additional-parser";
  return import(parserPath);
}

describe("parseAdditionalBank", () => {
  it("normalizes legacy games into explicit game kinds and trims Hebrew names", async () => {
    const { parseAdditionalBank } = await loadParser();
    const result = parseAdditionalBank(additionalBankRows);

    const byTitle = new Map(result.map((item: { title: string }) => [item.title, item]));

    expect(byTitle.get("שפיגל")).toMatchObject({
      kind: "competitive-game",
      progressionStage: null,
      sourceTab: "מאגר נוסף",
      sourceRow: 17,
    });
    expect(byTitle.get("משחק הקבלנים")).toMatchObject({ kind: "competitive-game" });
    expect(byTitle.get("קרב באוויר")).toMatchObject({ kind: "competitive-game" });
    expect(byTitle.get("תולעת דוחפת")).toMatchObject({ kind: "group-game" });
  });

  it("keeps attack/game-flow starters as game-flow sequences instead of technical drills", async () => {
    const { parseAdditionalBank } = await loadParser();
    const result = parseAdditionalBank(additionalBankRows);
    const byTitle = new Map(result.map((item: { title: string }) => [item.title, item]));

    for (const title of ["מקבלת סרב", "מחסימה", "מהגנה", "מחיפוי"]) {
      expect(byTitle.get(title)).toMatchObject({
        kind: "game-flow-sequence",
        progressionStage: null,
      });
    }
  });

  it("separates fixed warm-up ideas, serving/transition ideas, and coaching tags", async () => {
    const { parseAdditionalBank } = await loadParser();
    const result = parseAdditionalBank(additionalBankRows);
    const byTitle = new Map(result.map((item: { title: string }) => [item.title, item]));

    expect(byTitle.get("איזומטרי")).toMatchObject({ kind: "warmup-idea" });
    expect(byTitle.get("מחסנית")).toMatchObject({ kind: "warmup-idea" });
    expect(byTitle.get("סרב ואז הצלת כדור")).toMatchObject({ kind: "transition-idea" });
    expect(byTitle.get("לפי עמדות")).toMatchObject({ kind: "transition-idea" });
    expect(byTitle.get("עילית")).toMatchObject({ kind: "coaching-tag" });
    expect(byTitle.get("קבלת החלטות")).toMatchObject({ kind: "coaching-tag" });
    expect(byTitle.get("מירוץ שליחים 5 כדורים")).toMatchObject({ kind: "warmup-idea" });
  });

  it("does not emit section headers or blank rows as library items", async () => {
    const { parseAdditionalBank } = await loadParser();
    const result = parseAdditionalBank(additionalBankRows);
    const titles = result.map((item: { title: string }) => item.title);

    expect(titles).not.toContain("בלוקים");
    expect(titles).not.toContain("סרבים");
    expect(titles).not.toContain("חימום קבוע");
    expect(titles).not.toContain("משחקונים / תרגילים");
    expect(titles).not.toContain("הנחתות");
    expect(titles).not.toContain("טכניקה");
    expect(titles).not.toContain("משחקי חימום");
    expect(titles).not.toContain("");
  });

  it("preserves source metadata and section context without inventing an explanation", async () => {
    const { parseAdditionalBank } = await loadParser();
    const result = parseAdditionalBank(additionalBankRows);
    const item = result.find((entry: { title: string }) => entry.title === "מקבלת סרב");

    expect(item).toMatchObject({
      description: "",
      sourceTab: "מאגר נוסף",
      sourceRow: 33,
    });
    expect(item.content).toMatchObject({
      section: "הנחתות",
      sourceColumn: "A",
    });
    expect(item.sourceHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
