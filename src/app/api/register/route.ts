import { createHmac, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendAdminEmail, sendInvestorWelcomeEmail } from "@/lib/mailer";

function verifyInviteToken(token: string): { investorId: string; phone: string } | null {
  const dotIdx = token.lastIndexOf(".");
  if (dotIdx === -1) return null;
  const encoded = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf-8");
  } catch {
    return null;
  }
  const expectedSig = createHmac("sha256", process.env.OTP_SECRET!).update(payload).digest("hex");
  if (sig !== expectedSig) return null;
  const [investorId, phone, expiryStr] = payload.split(":");
  if (!investorId || !phone || !expiryStr || Date.now() > parseInt(expiryStr, 10)) return null;
  return { investorId, phone };
}

export async function POST(req: NextRequest) {
  const { name, phone, email, pan_number, bank_account, ifsc, return_type, invite_token } = await req.json();
  const normalizedReturnType = return_type === "CAGR" ? "CAGR" : "XIRR";

  // Validate invite token
  if (!invite_token) {
    return NextResponse.json({ error: "A valid invite link is required to register." }, { status: 403 });
  }
  const verifiedToken = verifyInviteToken(invite_token);
  if (!verifiedToken) {
    return NextResponse.json({ error: "Your invite link is invalid or has expired." }, { status: 403 });
  }

  if (!name || !phone || !email || !pan_number || !bank_account || !ifsc) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check for existing auth user or investor with this email
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const existingAuthUser = authUsers?.users.find(u => u.email === normalizedEmail);

  if (existingAuthUser) {
    const { data: existingInvestor } = await supabaseAdmin
      .from("investors")
      .select("investor_id")
      .eq("user_id", existingAuthUser.id)
      .maybeSingle();
    if (existingInvestor) {
      return NextResponse.json({ error: "An account already exists for this email. Please sign in." }, { status: 400 });
    }
  }

  // Create auth user
  const tempPassword = randomBytes(6).toString("base64url").slice(0, 10) + "Hv1!";
  let userId: string;
  let authUserCreated = false;

  if (existingAuthUser) {
    userId = existingAuthUser.id;
    // Reusing an existing auth account (e.g. it was created some other way before this
    // registration) — its real password is unknown to us, but the welcome email below
    // always tells the investor "your password is <tempPassword>", so that claim must
    // actually be true regardless of which branch created/found the account.
    const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: tempPassword });
    if (pwError) return NextResponse.json({ error: pwError.message }, { status: 500 });
  } else {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: tempPassword,
      email_confirm: true,
    });
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
    userId = authData.user.id;
    authUserCreated = true;
  }

  // Find the pending investor record created when the admin generated this invite —
  // looked up by the exact investor_id embedded in the token (not a fuzzy phone match),
  // so any investment already added against it stays attached to the same investor_id.
  const { data: pendingInvestor } = await supabaseAdmin
    .from("investors")
    .select("investor_id, investor_name, associate_name")
    .eq("investor_id", verifiedToken.investorId)
    .is("user_id", null)
    .maybeSingle();

  // The admin sends the invite under two names: the "main" name (M, stored as
  // investor_name on the pending row) and an associate name (A, stored as associate_name).
  // Whichever of the two the investor actually types as their own name here (B) tells us
  // which one was really the associate all along:
  //   - B matches M  -> normal case, M is really them, keep A as the associate.
  //   - B matches A  -> the names were effectively swapped; M was really the associate.
  //   - B matches neither -> a genuinely new name; M becomes the associate, A is discarded
  //     (it was never actually this investor's name to begin with in that case).
  // Comparison is case/whitespace-insensitive since names get typed inconsistently.
  const submittedName = name.trim();
  const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();
  const finalAssociateName = pendingInvestor
    ? (norm(submittedName) === norm(pendingInvestor.investor_name)
        ? pendingInvestor.associate_name
        : pendingInvestor.investor_name)
    : null;

  const investorFields = {
    user_id: userId,
    investor_name: submittedName,
    email: normalizedEmail,
    phone: phone.trim() || null,
    pan_number: pan_number.trim().toUpperCase() || null,
    bank_account_no: bank_account.trim() || null,
    bank_ifsc: ifsc.trim().toUpperCase() || null,
    associate_name: finalAssociateName,
    return_type: normalizedReturnType,
    is_active: true,
    requires_password_change: true,
    invite_token: null, // registration complete — the link is no longer valid/needed
  };

  const { error: investorError } = pendingInvestor
    ? await supabaseAdmin.from("investors").update(investorFields).eq("investor_id", pendingInvestor.investor_id)
    : await supabaseAdmin.from("investors").insert(investorFields);

  if (investorError) {
    if (authUserCreated) await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: investorError.message }, { status: 500 });
  }

  // Back-fill any investments an admin added while this investor was still pending
  // (created against investor_id before user_id existed) so the dashboard picks them up.
  // Failure here is surfaced loudly (ERROR log, admin-visible) rather than just console.error —
  // a silent failure here means real invested money becomes invisible on the investor's
  // dashboard with no one aware anything went wrong.
  if (pendingInvestor) {
    const { data: backfilled, error: backfillError } = await supabaseAdmin
      .from("investor_investments")
      .update({ user_id: userId })
      .eq("investor_id", pendingInvestor.investor_id)
      .is("user_id", null)
      .select("investment_id");

    if (backfillError) {
      console.error("[register] backfilling investor_investments.user_id failed:", backfillError);
      await supabaseAdmin.from("system_logs").insert({
        level: "ERROR",
        message: "Failed to backfill investment user_id after registration — investments may be invisible on dashboard",
        metadata: { investorId: pendingInvestor.investor_id, userId, errorDetails: backfillError.message },
      }).then(null, console.error);
    } else if (backfilled && backfilled.length > 0) {
      await supabaseAdmin.from("system_logs").insert({
        level: "INFO",
        message: "Backfilled investment user_id after registration",
        metadata: { investorId: pendingInvestor.investor_id, userId, investmentCount: backfilled.length },
      }).then(null, console.error);
    }
  }

  await supabaseAdmin.from("system_logs").insert({
    level: "INFO",
    message: pendingInvestor ? "Investor completed registration (backfilled pending record)" : "Investor self-registered via invite link",
    metadata: {
      name: name.trim(),
      email: normalizedEmail,
      auth_user_created: authUserCreated,
      investorId: pendingInvestor?.investor_id ?? null,
      finalAssociateName,
    },
  }).then(null, console.error);

  // Send welcome email with login credentials
  try {
    await sendInvestorWelcomeEmail({
      toName: name.trim(),
      toEmail: normalizedEmail,
      tempPassword,
      loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
    });
  } catch (mailErr) {
    console.error("[register] Welcome email failed:", mailErr);
  }

  // Send WhatsApp welcome message if template is configured
  const waPhoneId = process.env.META_WA_PHONE_NUMBER_ID;
  const waToken = process.env.META_WA_ACCESS_TOKEN;
  const waWelcomeTemplate = process.env.META_WA_TEMPLATE_CREDENTIALS;
  if (waPhoneId && waToken && waWelcomeTemplate) {
    const waPhone = phone.trim().replace(/[^\d]/g, "");
    const normalizedPhone = /^[6-9]\d{9}$/.test(waPhone) ? `91${waPhone}` : waPhone;
    fetch(`https://graph.facebook.com/v21.0/${waPhoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${waToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizedPhone,
        type: "template",
        template: {
          name: waWelcomeTemplate,
          language: { code: "en" },
          components: [{
            type: "body",
            parameters: [
              { type: "text", text: name.trim() },
              { type: "text", text: normalizedEmail },
              { type: "text", text: tempPassword },
            ],
          }],
        },
      }),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) {
        console.error("[register] WhatsApp welcome rejected by Meta:", data?.error);
      } else {
        console.log("[register] ✅ WhatsApp welcome sent to", normalizedPhone, "messageId=", data?.messages?.[0]?.id);
      }
    }).catch(err => console.error("[register] WhatsApp welcome network error:", err));
  }

  // Notify admin
  await sendAdminEmail({
    fromName: name,
    fromEmail: email,
    phone,
    subject: `New Investor Application - ${name}`,
    message: `A new investor has self-registered via invite link.\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nPAN: ${pan_number}\nBank Account: ${bank_account}\nIFSC: ${ifsc}\n\nView at: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/investors`,
  }).catch(console.error);

  return NextResponse.json({ success: true });
}
