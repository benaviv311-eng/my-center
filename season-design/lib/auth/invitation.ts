function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isEmailInAllowlist(email: string, rawAllowlist: string): boolean {
  const target = normalizeEmail(email);
  if (!target) return false;

  return rawAllowlist
    .split(/[;,\n]/)
    .map(normalizeEmail)
    .filter(Boolean)
    .includes(target);
}

export function isInvitedEmail(email: string): boolean {
  return isEmailInAllowlist(email, process.env.SEASON_DESIGN_ALLOWED_EMAILS ?? "");
}
