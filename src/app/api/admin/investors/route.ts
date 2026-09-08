import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendInvestorWelcomeEmail } from "@/lib/mailer";

// GET - list all investors with their auth email
export async function GET() {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [{ data: investors, error }, { data: authUsers }, { data: investments }] = await Promise.all([
    supabaseAdmin
      .from("investors")
      .select("investor_id, investor_name, user_id, phone, pan_number, bank_account_no, bank_ifsc, requires_password_change, is_active, associate_name")
      .order("investor_name"),
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    supabaseAdmin
      .from("investor_investments")
      .select("investor_id, total_amount"),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const emailMap: Record<string, string> = {};
  authUsers?.users.forEach(u => { emailMap[u.id] = u.email ?? ""; });

  // Group total invested capital per investor
  const capitalMap: Record<string, number> = {};
  (investments ?? []).forEach((inv: any) => {
    capitalMap[inv.investor_id] = (capitalMap[inv.investor_id] ?? 0) + Number(inv.total_amount ?? 0);
  });

  const enriched = (investors ?? []).map(inv => ({
    ...inv,
    email: emailMap[inv.user_id] ?? "",
    total_invested: capitalMap[inv.investor_id] ?? 0,
    has_active_investments: (capitalMap[inv.investor_id] ?? 0) > 0,
  }));

  return NextResponse.json({ investors: enriched });
}

// POST - create investor, creating auth user first if they don't exist
export async function POST(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, email, phone, associateName } = await req.json();

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  // 1. Check if this email already exists in auth.users
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const existingAuthUser = authUsers?.users.find(u => u.email === email);

  let userId: string;
  let authUserCreated = false;
  let tempPassword: string | null = null;

  if (existingAuthUser) {
    // User already in auth.users - reuse their ID
    userId = existingAuthUser.id;
  } else {
    // Auto-generate a secure temporary password
    tempPassword = randomBytes(6).toString("base64url").slice(0, 10) + "Hv1!";
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
    userId = authData.user.id;
    authUserCreated = true;
  }

  // 2. Check investor record doesn't already exist for this user
  const { data: existingInvestor } = await supabaseAdmin
    .from("investors")
    .select("investor_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingInvestor) {
    return NextResponse.json(
      { error: "An investor record already exists for this email." },
      { status: 400 }
    );
  }

  // 3. Create investor record mapped to the user_id
  const { error: investorError } = await supabaseAdmin
    .from("investors")
    .insert({
      user_id: userId,
      investor_name: name,
      email,
      phone: phone || null,
      associate_name: associateName || null,
      is_active: true,
      requires_password_change: true,
    });

  if (investorError) {
    if (authUserCreated) await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: investorError.message }, { status: 500 });
  }

  // Send welcome email with credentials (fire-and-forget, don't block on failure)
  if (authUserCreated && tempPassword) {
    try {
      await sendInvestorWelcomeEmail({
        toName: name,
        toEmail: email,
        tempPassword,
        loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
      });
    } catch (mailErr) {
      console.error("Welcome email failed:", mailErr);
    }
  }

  return NextResponse.json({
    success: true,
    userId,
    authUserCreated,
    emailSent: authUserCreated && !!tempPassword,
  });
}

// PATCH - update investor name and phone
export async function PATCH(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { investorId, name, phone, associateName, isActive, panNumber, bankAccount, ifsc } = await req.json();
  if (!investorId || !name) {
    return NextResponse.json({ error: "Investor ID and name are required." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("investors")
    .update({
      investor_name: name,
      phone: phone || null,
      associate_name: associateName || null,
      pan_number: panNumber ? panNumber.toUpperCase() : null,
      bank_account_no: bankAccount || null,
      bank_ifsc: ifsc ? ifsc.toUpperCase() : null,
      ...(typeof isActive === "boolean" ? { is_active: isActive } : {}),
    })
    .eq("investor_id", investorId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE - remove investor record and their auth user
export async function DELETE(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { investorId } = await req.json();
  if (!investorId) return NextResponse.json({ error: "Investor ID is required." }, { status: 400 });

  const { error: deleteError } = await supabaseAdmin
    .from("investors")
    .delete()
    .eq("investor_id", investorId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
