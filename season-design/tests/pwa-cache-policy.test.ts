import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workerSource = readFileSync(join(process.cwd(), "app", "sw.ts"), "utf8");

describe("PWA cache policy", () => {
  it("does not use Serwist default runtime caching for authenticated responses", () => {
    expect(workerSource).not.toContain("defaultCache");
    expect(workerSource).toContain("runtimeCaching: []");
  });
});
