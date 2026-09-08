import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const PAGE_SIZE = 50;

// GET ?page=1&level=INFO|WARN|ERROR&search=
export async function GET(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1"));
  const level = req.nextUrl.searchParams.get("level") ?? "";
  const search = req.nextUrl.searchParams.get("search")?.trim() ?? "";
  const investorSearch = req.nextUrl.searchParams.get("investor")?.trim() ?? "";

  // Resolve investor search term → matching user_ids
  let investorUserIds: string[] = [];
  if (investorSearch) {
    const [{ data: byName }, { data: authData }] = await Promise.all([
      supabaseAdmin.from("investors").select("user_id, investor_name").ilike("investor_name", `%${investorSearch}%`),
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    ]);
    const nameIds = (byName ?? []).map(i => i.user_id);
    const emailIds = (authData?.users ?? [])
      .filter(u => u.email?.toLowerCase().includes(investorSearch.toLowerCase()))
      .map(u => u.id);
    investorUserIds = [...new Set([...nameIds, ...emailIds])];
    // No matches → return empty immediately
    if (investorUserIds.length === 0) {
      return NextResponse.json({ logs: [], total: 0, page, pageSize: PAGE_SIZE, totalPages: 1 });
    }
  }

  let query = supabaseAdmin
    .from("system_logs")
    .select("id, level, message, metadata, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (level && ["INFO", "WARN", "ERROR"].includes(level)) {
    query = query.eq("level", level);
  }
  if (search) {
    query = query.ilike("message", `%${search}%`);
  }
  if (investorUserIds.length > 0) {
    query = query.or(investorUserIds.map(id => `metadata->>userId.eq.${id}`).join(","));
  }

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const logs = data ?? [];

  // Enrich with investor name + email from metadata.userId
  const userIds = [...new Set(logs.map(l => (l.metadata as any)?.userId).filter(Boolean))] as string[];
  const investorMap: Record<string, { name: string; email: string }> = {};

  if (userIds.length > 0) {
    // Reuse already-fetched authData if we did an investor search, else fetch now
    const [{ data: investors }, { data: authData }] = await Promise.all([
      supabaseAdmin.from("investors").select("user_id, investor_name").in("user_id", userIds),
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    ]);
    const authMap = Object.fromEntries((authData?.users ?? []).map(u => [u.id, u.email ?? ""]));
    for (const inv of investors ?? []) {
      investorMap[inv.user_id] = { name: inv.investor_name, email: authMap[inv.user_id] ?? "" };
    }
  }

  const enrichedLogs = logs.map(log => {
    const userId = (log.metadata as any)?.userId ?? null;
    return { ...log, investor: userId ? (investorMap[userId] ?? null) : null };
  });

  return NextResponse.json({
    logs: enrichedLogs,
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  });
}
