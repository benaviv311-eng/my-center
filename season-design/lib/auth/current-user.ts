import type { CurrentCoach } from "./access";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function getCurrentUser(): Promise<CurrentCoach | null> {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) return null;

  return {
    id: data.user.id,
    email: data.user.email,
  };
}
