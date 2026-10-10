export type CurrentCoach = { id: string; email: string };

export type AppAccessDecision =
  | { kind: "allow" }
  | { kind: "redirect"; to: "/login" | "/login?error=not-invited" };

export function resolveAppAccess(
  user: CurrentCoach | null,
  invited: boolean,
): AppAccessDecision {
  if (!user) return { kind: "redirect", to: "/login" };
  if (!invited) return { kind: "redirect", to: "/login?error=not-invited" };
  return { kind: "allow" };
}
