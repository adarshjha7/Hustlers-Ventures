import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const status = searchParams.get("status");

  let query = supabaseAdmin
    .from("opportunities")
    .select(`
      *,
      opportunity_categories ( id, name, slug ),
      company_pools ( pool_name, status, total_cost, investor_amount )
    `)
    .order("sort_order")
    .order("created_at", { ascending: false });

  if (categoryId) query = query.eq("category_id", categoryId);
  if (status)     query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = (data ?? []).map((o: any) => {
    const pool = o.company_pools;
    const filledPct = o.filled_pct != null
      ? o.filled_pct
      : pool?.total_cost && pool?.investor_amount
        ? Math.min(100, (Number(pool.investor_amount) / Number(pool.total_cost)) * 100)
        : null;
    return {
      ...o,
      computed_filled_pct: filledPct,
      pool_name: pool?.pool_name ?? null,
    };
  });

  return NextResponse.json({ opportunities: enriched });
}

export async function POST(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    category_id, title, slug, tagline, description,
    min_investment, target_irr, tenure, total_pool_size, filled_pct,
    pool_id, company_name, image_url, brochure_url, detail_url,
    whatsapp_number, gallery_folder_id,
    is_public, is_for_investor, status, sort_order,
    volatility_level, volatility_note,
  } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  if (!slug?.trim())  return NextResponse.json({ error: "Slug is required." }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("opportunities")
    .insert({
      category_id:      category_id || null,
      title:            title.trim(),
      slug:             slug.trim().toLowerCase().replace(/\s+/g, "-"),
      tagline:          tagline?.trim() || null,
      description:      description?.trim() || null,
      min_investment:   min_investment ? Number(min_investment) : null,
      target_irr:       target_irr ? Number(target_irr) : null,
      tenure:           tenure?.trim() || null,
      total_pool_size:  total_pool_size ? Number(total_pool_size) : null,
      filled_pct:       filled_pct != null ? Number(filled_pct) : null,
      pool_id:          pool_id || null,
      company_name:     company_name?.trim() || null,
      image_url:        image_url?.trim() || null,
      brochure_url:     brochure_url?.trim() || null,
      detail_url:       detail_url?.trim() || null,
      whatsapp_number:  whatsapp_number?.trim() || null,
      gallery_folder_id: gallery_folder_id?.trim() || null,
      is_public:        is_public ?? false,
      is_for_investor:  is_for_investor ?? false,
      status:           status || "draft",
      sort_order:       sort_order ? Number(sort_order) : 0,
      volatility_level: volatility_level || null,
      volatility_note:  volatility_note?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "An opportunity with this slug already exists." }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ opportunity: data });
}

export async function PATCH(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: "ID required." }, { status: 400 });

  const allowed = [
    "category_id", "title", "slug", "tagline", "description",
    "min_investment", "target_irr", "tenure", "total_pool_size", "filled_pct",
    "pool_id", "company_name", "image_url", "brochure_url", "detail_url",
    "whatsapp_number", "gallery_folder_id",
    "is_public", "is_for_investor", "status", "sort_order",
    "volatility_level", "volatility_note",
  ];

  const fields: Record<string, unknown> = {};
  for (const key of allowed) {
    if (rest[key] !== undefined) {
      if (["min_investment", "target_irr", "total_pool_size", "filled_pct", "sort_order"].includes(key)) {
        fields[key] = rest[key] != null && rest[key] !== "" ? Number(rest[key]) : null;
      } else if (typeof rest[key] === "string") {
        fields[key] = rest[key].trim() || null;
      } else {
        fields[key] = rest[key];
      }
    }
  }

  if (fields.slug) fields.slug = (fields.slug as string).toLowerCase().replace(/\s+/g, "-");

  const { data, error } = await supabaseAdmin
    .from("opportunities")
    .update(fields)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ opportunity: data });
}

export async function DELETE(req: NextRequest) {
  const admin = await guardAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required." }, { status: 400 });

  const { error } = await supabaseAdmin.from("opportunities").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
