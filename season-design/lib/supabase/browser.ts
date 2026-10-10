import { createBrowserClient } from "@supabase/ssr";

function publicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error("SeasonDesign Supabase public configuration is missing");
  }
  return { url, publishableKey };
}

export function getSupabaseBrowser() {
  const { url, publishableKey } = publicSupabaseConfig();
  return createBrowserClient(url, publishableKey);
}
