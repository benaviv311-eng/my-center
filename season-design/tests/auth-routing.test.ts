import { describe, expect, it } from "vitest";
import { resolveAppAccess } from "@/lib/auth/access";
import { isEmailInAllowlist } from "@/lib/auth/invitation";
import { GET as authCallback } from "@/app/auth/callback/route";

describe("SeasonDesign authentication routing", () => {
  it("redirects an unauthenticated visitor to login", () => {
    expect(resolveAppAccess(null, false)).toEqual({ kind: "redirect", to: "/login" });
  });

  it("allows an authenticated invited coach", () => {
    const user = { id: "11111111-1111-1111-1111-111111111111", email: "Coach@Example.com" };
    const invited = isEmailInAllowlist(user.email, "other@example.com, coach@example.com");

    expect(invited).toBe(true);
    expect(resolveAppAccess(user, invited)).toEqual({ kind: "allow" });
  });

  it("rejects an authenticated but uninvited identity", () => {
    const user = { id: "22222222-2222-2222-2222-222222222222", email: "outsider@example.com" };
    const invited = isEmailInAllowlist(user.email, "coach@example.com");

    expect(invited).toBe(false);
    expect(resolveAppAccess(user, invited)).toEqual({
      kind: "redirect",
      to: "/login?error=not-invited",
    });
  });

  it("returns a safe login redirect when the OAuth callback has no code", async () => {
    const response = await authCallback(new Request("http://localhost:3000/auth/callback"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=auth-callback",
    );
  });
});
