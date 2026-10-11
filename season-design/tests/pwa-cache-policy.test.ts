import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workerSource = readFileSync(new URL("../app/sw.ts", import.meta.url), "utf8");

describe("PWA cache policy", () => {
  it("does not use Serwist default runtime caching for authenticated responses", () => {
    expect(workerSource).not.toContain("defaultCache");
    expect(workerSource).toContain("runtimeCaching: []");
  });
});
