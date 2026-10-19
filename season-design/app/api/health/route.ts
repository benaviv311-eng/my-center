/**
 * Public liveness probe for the dedicated SeasonDesign Next.js service.
 * Checks only deployment configuration presence; never returns credentials.
 */
export const dynamic = "force-dynamic";

export function GET(): Response {
  const configured = [
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.SEASON_DESIGN_ALLOWED_EMAILS,
  ].every((value) => typeof value === "string" && value.trim().length > 0);

  return Response.json(
    {
      product: "SeasonDesign",
      status: configured ? "ok" : "unconfigured",
    },
    {
      status: configured ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
