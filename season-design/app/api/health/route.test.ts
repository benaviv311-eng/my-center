import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

afterEach(() => vi.unstubAllEnvs());

describe("SeasonDesign Render health check", () => {
  it("returns 503 until required production configuration is present", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("SEASON_DESIGN_ALLOWED_EMAILS", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const result = GET();
    expect(result.status).toBe(503);
    expect(await result.json()).toMatchObject({ status: "unconfigured" });
  });

  it("returns healthy without exposing env values after configuration", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-public-key");
    vi.stubEnv("SEASON_DESIGN_ALLOWED_EMAILS", "coach@example.org");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "server-only-value");
    const result = GET();
    expect(result.status).toBe(200);
    const body = await result.json();
    expect(body).toMatchObject({ status: "ok", product: "SeasonDesign" });
    expect(JSON.stringify(body)).not.toContain("test-public-key");
    expect(JSON.stringify(body)).not.toContain("server-only-value");
    expect(JSON.stringify(body)).not.toContain("coach@example.org");
  });
});
