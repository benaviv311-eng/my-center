import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { forearmRows, warmupRows } from "./fixtures/core-tabs";

const configModule = new URL("./config.ts", import.meta.url);
const parserModule = new URL("./core-parser.ts", import.meta.url);

async function loadModules() {
  expect(existsSync(fileURLToPath(configModule))).toBe(true);
  expect(existsSync(fileURLToPath(parserModule))).toBe(true);

  const configPath = "./config";
  const parserPath = "./core-parser";
  const config = await import(configPath);
  const parser = await import(parserPath);
  return { config, parser };
}

describe("core Sheet configuration", () => {
  it("maps every approved core tab and the additional-bank tab exactly", async () => {
    const { config } = await loadModules();

    expect(Object.keys(config.SHEET_TAB_CONFIG)).toEqual([
      "משחקי חימום",
      "מאגר נוסף",
      "תחתית",
      "עילית",
      "הנחתה",
      "חסימה",
      "הגשה",
    ]);
    expect(config.SHEET_TAB_CONFIG["משחקי חימום"].kind).toBe("warmup-game");
    expect(config.SHEET_TAB_CONFIG["תחתית"].skillSlug).toBe("forearm_pass");
    expect(config.SHEET_TAB_CONFIG["עילית"].skillSlug).toBe("overhead_setting");
    expect(config.SHEET_TAB_CONFIG["הנחתה"].skillSlug).toBe("attack");
    expect(config.SHEET_TAB_CONFIG["חסימה"].skillSlug).toBe("block");
    expect(config.SHEET_TAB_CONFIG["הגשה"].skillSlug).toBe("serve");
    expect(config.SHEET_TAB_CONFIG["מאגר נוסף"].parser).toBe("additional");
  });
});

describe("parseCoreTab", () => {
  it("parses all four progression column pairs without treating spacer columns as exercises", async () => {
    const { parser } = await loadModules();
    const result = parser.parseCoreTab({ tabName: "תחתית", rows: forearmRows });

    expect(result).toHaveLength(5);
    expect(result.map((item: { progressionStage: string | null }) => item.progressionStage)).toEqual([
      "isolated",
      "fixed",
      "complex",
      "game-situation",
      "game-situation",
    ]);
    expect(result[0]).toMatchObject({
      title: "לאנץ׳",
      description: "עבודה על זווית הפלטפורמה",
      sourceTab: "תחתית",
      sourceRow: 3,
      skillSlug: "forearm_pass",
      kind: "technical",
    });
    expect(result[3].title).toBe("קבלה למוסר מקו קדמי");
    expect(result[4].title).toBe("כדור קצר ואז מיד כדור עמוק");
    expect(result[4].description).toBe("");
  });

  it("keeps Hebrew warm-up fields intact and ignores the header row", async () => {
    const { parser } = await loadModules();
    const result = parser.parseCoreTab({ tabName: "משחקי חימום", rows: warmupRows });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      title: "תפוס את הכדור",
      kind: "warmup-game",
      progressionStage: null,
      sourceRow: 2,
    });
    expect(result[0].content).toMatchObject({
      objective: "תגובה ומהירות",
      setup: "זוגות",
      flow: "המאמן זורק והילדים מגיבים",
      coachCues: "עמידת מוצא",
      playerPrompt: "מוכנים?",
    });
    expect(result[0].normalizedSignature).toContain("תפוס את הכדור");
    expect(result[0].sourceHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("ignores an entirely empty data row", async () => {
    const { parser } = await loadModules();
    const result = parser.parseCoreTab({
      tabName: "תחתית",
      rows: [{ rowNumber: 7, values: ["", "", "", "", "", "", "", "", "", "", ""] }],
    });

    expect(result).toEqual([]);
  });
});
