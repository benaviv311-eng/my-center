"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

const errorCopy: Record<string, string> = {
  "not-invited": "החשבון הזה עדיין לא הוזמן ל־SeasonDesign.",
  "auth-callback": "ההתחברות לא הושלמה. אפשר לנסות שוב.",
  "profile-activation": "החשבון אומת, אבל הפעלת הגישה נכשלה. נסה שוב.",
};

function LoginContent() {
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const error = searchParams.get("error");
  const queryError = error ? errorCopy[error] ?? null : null;
  const errorMessage = localError ?? queryError;

  async function signIn() {
    setBusy(true);
    setLocalError(null);
    try {
      const supabase = getSupabaseBrowser();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) throw oauthError;
    } catch {
      setLocalError("לא הצלחנו לפתוח את ההתחברות ל־Google.");
      setBusy(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="login-title">
      <p className="eyebrow">גישה פרטית למאמנים מוזמנים</p>
      <h1 id="login-title">SeasonDesign</h1>
      <p>התחבר עם חשבון Google שהוזמן למערכת.</p>
      {errorMessage && <p role="alert">{errorMessage}</p>}
      <button type="button" onClick={signIn} disabled={busy}>
        {busy ? "מתחבר…" : "התחברות עם Google"}
      </button>
    </section>
  );
}

export default function LoginPage() {
  return (
    <main className="offlinePage">
      <Suspense fallback={<section className="panel">טוען התחברות…</section>}>
        <LoginContent />
      </Suspense>
    </main>
  );
}
