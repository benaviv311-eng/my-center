import { NextResponse } from "next/server";
import { isInvitedEmail } from "@/lib/auth/invitation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServer } from "@/lib/supabase/server";

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  if (!code) return redirectTo(request, "/login?error=auth-callback");

  const supabase = await getSupabaseServer();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) return redirectTo(request, "/login?error=auth-callback");

  const { data, error: userError } = await supabase.auth.getUser();
  const user = data.user;
  if (userError || !user?.email) {
    await supabase.auth.signOut();
    return redirectTo(request, "/login?error=auth-callback");
  }

  const email = user.email.trim().toLowerCase();
  if (!isInvitedEmail(email)) {
    await supabase.auth.signOut();
    return redirectTo(request, "/login?error=not-invited");
  }

  const admin = getSupabaseAdmin();
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: user.id,
      email,
      access_status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (profileError) {
    await supabase.auth.signOut();
    return redirectTo(request, "/login?error=profile-activation");
  }

  return redirectTo(request, "/");
}
