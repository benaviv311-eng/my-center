import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { resolveAppAccess } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isInvitedEmail } from "@/lib/auth/invitation";

export const dynamic = "force-dynamic";

export default async function ProtectedAppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const decision = resolveAppAccess(user, user ? isInvitedEmail(user.email) : false);
  if (decision.kind === "redirect") redirect(decision.to);

  return <>{children}</>;
}
