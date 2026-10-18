import { describe, expect, it } from "vitest";
import { BASIC_RECEPTION_INTENT } from "./fixtures";
import { normalizeIntent } from "./intent";

describe("practice intent", () => {
  it("preserves explicit Focus 1 before Focus 2", () => {
    const input = { ...BASIC_RECEPTION_INTENT, focuses: ["reception", "attack"] };
    expect(normalizeIntent(input).focuses).toEqual(["reception", "attack"]);
  });
  it("rejects focus duplicates and fractional time", () => {
    expect(() => normalizeIntent({ ...BASIC_RECEPTION_INTENT, focuses: ["serve", "serve"] })).toThrow();
    expect(() => normalizeIntent({ ...BASIC_RECEPTION_INTENT, durationSeconds: 3600.5 })).toThrow();
  });
});
