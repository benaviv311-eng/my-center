import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Render Blueprint deployment contract", () => {
  const root = resolve(process.cwd());
  const blueprint = readFileSync(resolve(root, "../render.yaml"), "utf8");
  const buildCommand = blueprint.match(/^\s*buildCommand:\s*(.+)$/m)?.[1] ?? "";

  it("never uses npm ci without a committed package-lock.json", () => {
    const lockExists = existsSync(resolve(root, "package-lock.json"));
    expect(!buildCommand.includes("npm ci") || lockExists).toBe(true);
  });

  it("upgrades the bundled npm 10 before installing the Vite/Vitest peer graph", () => {
    // Render Node 22 bundles npm 10, which may crash on current Vite peer deps
    // with "Cannot read properties of null (reading edgesOut)".
    expect(buildCommand).toMatch(/^npm install --global npm@11(?:\\.\\d+){0,2} && npm /);
  });

  it("targets the standalone Next.js directory and health endpoint", () => {
    expect(blueprint).toContain("rootDir: season-design");
    expect(blueprint).toContain("healthCheckPath: /api/health");
    expect(blueprint).toContain("branch: feature/season-design-library-sync");
  });

  it("never checks server-side secrets into the deployment file", () => {
    expect(blueprint).toMatch(/- key: SUPABASE_SERVICE_ROLE_KEY\s+sync: false/);
    expect(blueprint).not.toMatch(/- key: SUPABASE_SERVICE_ROLE_KEY\s+value:/);
  });
});
