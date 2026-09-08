import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ investors: [], investments: [], opportunities: [], loans: [] });

  const term = `%${q}%`;

  const [
    { data: investors },
    { data: authUsers },
    { data: investments },
    { data: opportunities },
    { data: loans },
  ] = await Promise.all([
    supabaseAdmin
      .from("investors")
      .select("investor_id, investor_name, user_id, is_active, requires_password_change")
      .ilike("investor_name", term)
      .limit(5),
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    supabaseAdmin
      .from("investor_investments")
      .select("investment_id, company_name, total_amount, user_id, company_pools ( pool_name )")
      .or(`company_name.ilike.${term}`)
      .limit(5),
    supabaseAdmin
      .from("opportunities")
      .select("id, title, tagline, status, opportunity_categories ( name )")
      .or(`title.ilike.${term},tagline.ilike.${term}`)
      .limit(5),
    supabaseAdmin
      .from("loans")
      .select("loan_id, borrower_name, loan_type, status, principal")
      .ilike("borrower_name", term)
      .limit(5),
  ]);

  const emailMap: Record<string, string> = {};
  (authUsers as any)?.users?.forEach((u: any) => { emailMap[u.id] = u.email ?? ""; });

  // Also search investors by email
  const emailMatches = (authUsers as any)?.users
    ?.filter((u: any) => u.email?.toLowerCase().includes(q.toLowerCase()))
    ?.map((u: any) => u.id) ?? [];

  const { data: investorsByEmail } = emailMatches.length > 0
    ? await supabaseAdmin.from("investors").select("investor_id, investor_name, user_id, is_active, requires_password_change").in("user_id", emailMatches.slice(0, 5))
    : { data: [] };

  // Merge and deduplicate investor results
  const allInvestors = [...(investors ?? []), ...(investorsByEmail ?? [])]
    .filter((v, i, a) => a.findIndex(x => x.investor_id === v.investor_id) === i)
    .slice(0, 5)
    .map((inv: any) => ({
      investor_id: inv.investor_id,
      investor_name: inv.investor_name,
      email: emailMap[inv.user_id] ?? "",
      is_active: inv.is_active,
      requires_password_change: inv.requires_password_change,
    }));

  const enrichedInvestments = (investments ?? []).map((inv: any) => ({
    investment_id: inv.investment_id,
    name: inv.company_name || (inv.company_pools as any)?.pool_name || "Unnamed",
    total_amount: inv.total_amount,
    investor_email: emailMap[inv.user_id] ?? "",
  }));

  return NextResponse.json({
    investors: allInvestors,
    investments: enrichedInvestments,
    opportunities: (opportunities ?? []).map((o: any) => ({
      id: o.id,
      title: o.title,
      tagline: o.tagline,
      status: o.status,
      category: (o.opportunity_categories as any)?.name ?? null,
    })),
    loans: (loans ?? []).map((l: any) => ({
      loan_id: l.loan_id,
      borrower_name: l.borrower_name,
      loan_type: l.loan_type,
      status: l.status,
      principal: l.principal,
    })),
  });
}
