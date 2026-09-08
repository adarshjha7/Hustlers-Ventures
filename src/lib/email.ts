// Email is sent via a Google Apps Script Web App that calls MailApp.sendEmail.
// (Reuses the same script that previously handled Google Form submissions.)
// Set APPS_SCRIPT_EMAIL_URL + ONBOARDING_SECRET in .env.local.

type SendCredentialsArgs = {
  to: string;
  name: string;
  password: string;
  loginUrl: string;
};

type SendResult = { ok: true } | { ok: false; error: string };

export async function sendCredentialsEmail(args: SendCredentialsArgs): Promise<SendResult> {
  const url = process.env.APPS_SCRIPT_EMAIL_URL;
  const secret = process.env.ONBOARDING_SECRET;
  if (!url) {
    console.warn("[email] APPS_SCRIPT_EMAIL_URL not set - skipping send");
    return { ok: false, error: "APPS_SCRIPT_EMAIL_URL not set" };
  }
  if (!secret) {
    return { ok: false, error: "ONBOARDING_SECRET not set" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sendCredentials",
        secret,
        email: args.to,
        name: args.name,
        password: args.password,
        loginUrl: args.loginUrl,
      }),
      // Apps Script returns a redirect to its execution endpoint; let fetch follow it.
      redirect: "follow",
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text || `HTTP ${res.status}` };
    }
    const data = await res.json().catch(() => null);
    if (!data || !data.ok) {
      return { ok: false, error: data?.error ?? "Apps Script returned non-ok" };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Network error" };
  }
}
