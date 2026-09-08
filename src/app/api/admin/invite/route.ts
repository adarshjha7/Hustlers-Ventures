import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/admin/invite
 * Body: { name: string, phone: string }
 *
 * Creates the investor record immediately (investor_id, no login yet — user_id stays
 * null until they complete /register) so an investment can be added against them right
 * away, even before they've filled in email/PAN/bank details. Then sends a WhatsApp
 * message with a signed 7-day registration link via the `META_WA_TEMPLATE_NAME`
 * template, CC'd to up to 2 fixed numbers (META_WA_ONBOARDING_CC_NUMBER_1/2) alongside
 * the investor's own number.
 *
 * Investor fills /register (token-gated) → /api/register verifies the token, finds this
 * same pending investor row by phone, and fills in the rest (email/PAN/bank/etc.) rather
 * than creating a duplicate.
 */

// Last 10 digits, ignoring country code / formatting — used only to de-dupe against
// existing investors regardless of how their phone happens to be stored.
function last10(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

// True if a stored invite_token is still within its 7-day window — expiry is always the
// last colon-separated segment of the payload, regardless of token format/version.
function isTokenStillValid(token: string): boolean {
  try {
    const [encoded] = token.split(".");
    const parts = Buffer.from(encoded, "base64url").toString("utf-8").split(":");
    const expiryStr = parts[parts.length - 1];
    return Date.now() <= parseInt(expiryStr, 10);
  } catch {
    return false;
  }
}

async function sendInviteWhatsApp(toPhone: string, name: string, inviteUrl: string) {
  const phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;
  const accessToken = process.env.META_WA_ACCESS_TOKEN;
  const templateName = process.env.META_WA_TEMPLATE_NAME;
  if (!phoneNumberId || !accessToken || !templateName) {
    return { ok: false as const, error: "WhatsApp not configured" };
  }

  try {
    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en" },
          components: [{ type: "body", parameters: [{ type: "text", text: name }, { type: "text", text: inviteUrl }] }],
        },
      }),
    });
    const metaData = await metaRes.json();
    if (!metaRes.ok) {
      console.error(`[admin/invite] Meta rejected send to +${toPhone}:`, metaData);
      return { ok: false as const, error: metaData?.error?.message ?? "Meta API rejected the request." };
    }
    return { ok: true as const, messageId: metaData?.messages?.[0]?.id ?? null };
  } catch (err: any) {
    console.error(`[admin/invite] Network error sending to +${toPhone}:`, err?.message);
    return { ok: false as const, error: err?.message ?? "Network error" };
  }
}

export async function POST(req: Request) {
  const user = await guardAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const siteUrl = new URL(req.url).origin;

  let body: { name?: unknown; phone?: unknown; investorId?: unknown; associateName?: unknown };
  try {
    body = (await req.json()) as { name?: unknown; phone?: unknown; investorId?: unknown; associateName?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  let phone = typeof body.phone === "string" ? body.phone.replace(/[^\d]/g, "") : "";
  if (/^[6-9]\d{9}$/.test(phone)) phone = `91${phone}`;
  // Explicit associate name, if the admin knows it - falls back to the send-time name
  // itself when left blank (see the write sites below for the reasoning).
  const associateName = (typeof body.associateName === "string" && body.associateName.trim()) || name;
  // Row-scoped resend/update: the caller (Admin -> Investors, per-row action) already knows
  // exactly which pending investor this is, so we skip fuzzy phone matching entirely and
  // operate on this exact row. This is what makes changing a pending investor's phone number
  // safe - the fuzzy-match path below can't find a renamed/renumbered row and would create a
  // duplicate + orphan their investments instead of updating the original one.
  const explicitInvestorId = typeof body.investorId === "string" && body.investorId ? body.investorId : null;

  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!/^\d{8,15}$/.test(phone)) {
    return NextResponse.json(
      { error: "Phone must be 8-15 digits in international format." },
      { status: 400 }
    );
  }

  let investorId: string;
  let reusableToken: string | null = null;
  let resent = false; // true whenever we're targeting a pre-existing row, for the system_logs entry

  if (explicitInvestorId) {
    const { data: target, error: targetErr } = await supabaseAdmin
      .from("investors")
      .select("investor_id, user_id")
      .eq("investor_id", explicitInvestorId)
      .maybeSingle();
    if (targetErr) return NextResponse.json({ error: targetErr.message }, { status: 500 });
    if (!target) return NextResponse.json({ error: "Investor not found." }, { status: 404 });
    if (target.user_id) {
      return NextResponse.json({ error: "This investor has already registered." }, { status: 400 });
    }
    investorId = target.investor_id;
    resent = true;
    await supabaseAdmin.from("investors").update({ investor_name: name, phone, associate_name: associateName }).eq("investor_id", investorId);
    // Always mint a fresh token here - the whole point of this path is that the name
    // and/or phone may have just changed, so reusing whatever token was already stored
    // (which could have the OLD phone baked into its signed payload) would be wrong.
    // reusableToken stays null.
  } else {
    // Find or create the investor record for this phone (fuzzy match on last 10 digits so
    // it still catches existing rows stored in a different format, e.g. "+91 90002 72020").
    const { data: candidates, error: lookupError } = await supabaseAdmin
      .from("investors")
      .select("investor_id, user_id, investor_name, phone, invite_token")
      .not("phone", "is", null);
    if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });

    const existing = (candidates ?? []).find(c => last10(c.phone ?? "") === last10(phone));

    if (existing?.user_id) {
      return NextResponse.json(
        { error: `${existing.investor_name} is already registered with this phone number.` },
        { status: 409 }
      );
    } else if (existing) {
      // Pending record from a previous invite — reuse it, just refresh the name.
      investorId = existing.investor_id;
      resent = true;
      await supabaseAdmin.from("investors").update({ investor_name: name, associate_name: associateName }).eq("investor_id", investorId);
    } else {
      // associate_name defaults to the send-time name when not given explicitly: the admin
      // usually only knows the associate/referrer at invite time, not the actual investor's
      // own name (that only becomes known once they fill /register themselves). api/register
      // deliberately never overwrites associate_name, so this is the one place it's set -
      // if the investor later fills in the same name themselves, associate_name just ends
      // up equal to investor_name, which is the correct "no separate associate" case.
      const { data: created, error: insertError } = await supabaseAdmin
        .from("investors")
        .insert({ investor_name: name, phone, is_active: true, associate_name: associateName })
        .select("investor_id")
        .single();
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
      investorId = created.investor_id;
    }

    // Reuse the existing stored token if it's still valid (e.g. WhatsApp failed last time
    // and the admin is retrying) — keeps the same link working every time instead of
    // silently minting a new one and orphaning whatever was already shared/copied.
    // Only mints a fresh 7-day token when there isn't one yet, or the old one expired.
    reusableToken = existing?.invite_token && isTokenStillValid(existing.invite_token)
      ? existing.invite_token
      : null;
  }

  let token: string;
  if (reusableToken) {
    token = reusableToken;
  } else {
    // investorId is embedded directly so /api/register can look up the pending record by
    // exact ID instead of fuzzy-matching phone strings — phone stays in for display/legacy.
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const payload = `${investorId}:${phone}:${expiry}`;
    const sig = createHmac("sha256", process.env.OTP_SECRET!).update(payload).digest("hex");
    token = `${Buffer.from(payload).toString("base64url")}.${sig}`;

    // Persist the token so the same link can be re-copied/re-sent later without minting
    // yet another one.
    await supabaseAdmin.from("investors").update({ invite_token: token }).eq("investor_id", investorId)
      .then(null, err => console.error("[admin/invite] failed to save invite_token:", err));
  }
  // encodeURIComponent prevents WhatsApp from truncating the URL at the "." separator
  const inviteUrl = `${siteUrl}/register?token=${encodeURIComponent(token)}`;

  // Primary send (the investor themselves) determines the response status.
  const primaryResult = await sendInviteWhatsApp(phone, name, inviteUrl);

  // Best-effort CC to up to 2 fixed numbers — awaited (not fire-and-forget) so the actual
  // per-number result can be logged; a CC failure still never fails the primary response.
  const ccNumbers = [process.env.META_WA_ONBOARDING_CC_NUMBER_1, process.env.META_WA_ONBOARDING_CC_NUMBER_2]
    .filter((n): n is string => !!n?.trim());
  const ccResults = await Promise.all(
    ccNumbers.map(async ccNumber => {
      const cleaned = ccNumber.replace(/[^\d]/g, "");
      const result = await sendInviteWhatsApp(cleaned, name, inviteUrl).catch(err => ({ ok: false as const, error: err?.message ?? "Unknown error" }));
      if (!result.ok) console.error(`[admin/invite] CC send to ${cleaned} failed:`, result.error);
      return { number: cleaned, sent: result.ok, error: result.ok ? null : result.error };
    })
  );

  // Single source of truth for the "Onboarding Status" report — message is matched
  // exactly by /api/admin/onboarding-status, and metadata.investorId/whatsappSent are
  // read from there rather than needing a schema change on `investors`.
  await supabaseAdmin.from("system_logs").insert({
    level: primaryResult.ok ? "INFO" : "WARN",
    message: "Onboarding invite sent",
    metadata: {
      adminEmail: user.email,
      investorId,
      name,
      phone,
      associateName,
      resent,
      viaRowAction: !!explicitInvestorId,
      tokenReused: !!reusableToken,
      whatsappSent: primaryResult.ok,
      ccResults,
      whatsappError: primaryResult.ok ? null : primaryResult.error,
    },
  }).then(null, console.error);

  if (!primaryResult.ok) {
    return NextResponse.json({ ok: true, inviteUrl, investorId, whatsappSent: false, whatsappError: primaryResult.error });
  }
  return NextResponse.json({ ok: true, inviteUrl, investorId, whatsappSent: true, messageId: primaryResult.messageId });
}
